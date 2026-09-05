import { describe, it, expect, beforeEach, vi } from "vitest";
import { QuotationStateMachine } from "../services/QuotationStateMachine.js";
import { QuotationState } from "../types/types.js";
import {
  InvalidTransitionError,
  UnauthorizedTransitionError,
  ApprovalIncompleteError,
  QuotationNotFoundError,
} from "../utils/errors.js";
import {
  createMockPrisma,
  mockQuotation,
  mockUser,
  mockManagerUser,
  mockFinanceUser,
  mockAdminUser,
} from "./helpers.js";

describe("QuotationStateMachine", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let mockWorkflowService: any;
  let stateMachine: QuotationStateMachine;

  beforeEach(() => {
    prisma = createMockPrisma();

    mockWorkflowService = {
      onTransition: vi.fn().mockImplementation(async (context) => {
        if (context.targetState === QuotationState.Submitted) {
          return {
            nextState: QuotationState.PendingManager,
            autoAdvance: true,
            workflowDetails: { ruleResult: { decision: "Manager review needed" } },
          };
        }
        return {};
      }),
      onApproved: vi.fn().mockResolvedValue(undefined),
    };

    stateMachine = new QuotationStateMachine(prisma, {
      workflowService: mockWorkflowService,
    });
  });

  describe("Lifecycle Transitions (Happy Path)", () => {
    it("transitions from Draft to Submitted (auto-progressing to PendingManager)", async () => {
      const result = await stateMachine.transition(
        "quot-1",
        QuotationState.Submitted,
        "user-rep-1",
        "Submitted by sales rep",
      );

      expect(result.success).toBe(true);
      expect(result.currentState).toBe(QuotationState.PendingManager);
      expect(result.actorId).toBe("user-rep-1");
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);

      // Verify Prisma quotation status updated
      expect(prisma.quotation.update).toHaveBeenCalled();
    });

    it("progresses quotation from PendingManager to PendingFinance", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingManager;

      const result = await stateMachine.transition(
        "quot-1",
        QuotationState.PendingFinance,
        "user-mgr-1",
        "Stage 1 approved by manager",
      );

      expect(result.success).toBe(true);
      expect(result.previousState).toBe(QuotationState.PendingManager);
      expect(result.currentState).toBe(QuotationState.PendingFinance);
    });

    it("progresses quotation from PendingFinance to Approved when approvals are complete", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingFinance;
      prisma._state.approvals.push(
        { id: "appr-1", quotationId: "quot-1", stage: 1, status: "APPROVED" },
        { id: "appr-2", quotationId: "quot-1", stage: 2, status: "APPROVED" },
      );

      const result = await stateMachine.transition(
        "quot-1",
        QuotationState.Approved,
        "user-fin-1",
        "Final approval granted by finance",
      );

      expect(result.success).toBe(true);
      expect(result.currentState).toBe(QuotationState.Approved);
    });

    it("progresses quotation through Approved -> Reserved -> Fulfilled -> Closed", async () => {
      // 1. Approved -> Reserved
      prisma._state.quotations[0].status = QuotationState.Approved;
      const res1 = await stateMachine.transition(
        "quot-1",
        QuotationState.Reserved,
        "user-rep-1",
        "Inventory reserved",
      );
      expect(res1.currentState).toBe(QuotationState.Reserved);

      // 2. Reserved -> Fulfilled
      prisma._state.quotations[0].status = QuotationState.Reserved;
      const res2 = await stateMachine.transition(
        "quot-1",
        QuotationState.Fulfilled,
        "user-admin-1",
        "Order dispatched and fulfilled",
      );
      expect(res2.currentState).toBe(QuotationState.Fulfilled);

      // 3. Fulfilled -> Closed
      prisma._state.quotations[0].status = QuotationState.Fulfilled;
      const res3 = await stateMachine.transition(
        "quot-1",
        QuotationState.Closed,
        "user-admin-1",
        "Deal closed",
      );
      expect(res3.currentState).toBe(QuotationState.Closed);
    });
  });

  describe("Invalid Transitions Guard (409)", () => {
    it("rejects illegal direct jump: Draft -> Fulfilled with 409", async () => {
      await expect(
        stateMachine.transition("quot-1", QuotationState.Fulfilled, "user-rep-1"),
      ).rejects.toThrow(InvalidTransitionError);
    });

    it("rejects illegal jump: Rejected -> Approved with 409", async () => {
      prisma._state.quotations[0].status = QuotationState.Rejected;

      await expect(
        stateMachine.transition("quot-1", QuotationState.Approved, "user-mgr-1"),
      ).rejects.toThrow(InvalidTransitionError);
    });

    it("rejects illegal transition: Closed -> Draft with 409", async () => {
      prisma._state.quotations[0].status = QuotationState.Closed;

      await expect(
        stateMachine.transition("quot-1", QuotationState.Draft, "user-admin-1"),
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe("Rejected and Returned for Revision Workflows", () => {
    it("supports PendingManager -> Rejected -> ReturnedForRevision", async () => {
      // 1. PendingManager -> Rejected
      prisma._state.quotations[0].status = QuotationState.PendingManager;
      const rejectResult = await stateMachine.transition(
        "quot-1",
        QuotationState.Rejected,
        "user-mgr-1",
        "Margin threshold violated",
      );
      expect(rejectResult.currentState).toBe(QuotationState.Rejected);

      // 2. Rejected -> ReturnedForRevision
      prisma._state.quotations[0].status = QuotationState.Rejected;
      const returnResult = await stateMachine.transition(
        "quot-1",
        QuotationState.ReturnedForRevision,
        "user-mgr-1",
        "Please reduce discount to 10%",
      );
      expect(returnResult.currentState).toBe(QuotationState.ReturnedForRevision);

      // 3. ReturnedForRevision -> Draft (rep modifies quotation)
      prisma._state.quotations[0].status = QuotationState.ReturnedForRevision;
      const draftResult = await stateMachine.transition(
        "quot-1",
        QuotationState.Draft,
        "user-rep-1",
        "Reopened for discount adjustment",
      );
      expect(draftResult.currentState).toBe(QuotationState.Draft);
    });
  });

  describe("Approval Completion Guard", () => {
    it("rejects transition to Approved when approval records are still pending", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingFinance;
      prisma._state.approvals.push({
        id: "appr-1",
        quotationId: "quot-1",
        stage: 2,
        status: "PENDING",
      });

      await expect(
        stateMachine.transition("quot-1", QuotationState.Approved, "user-fin-1"),
      ).rejects.toThrow(ApprovalIncompleteError);
    });
  });

  describe("Closed Quotation Terminal State", () => {
    it("prevents any state transitions from Closed state", async () => {
      prisma._state.quotations[0].status = QuotationState.Closed;

      await expect(
        stateMachine.transition("quot-1", QuotationState.Fulfilled, "user-admin-1"),
      ).rejects.toThrow(InvalidTransitionError);

      await expect(
        stateMachine.transition("quot-1", QuotationState.Draft, "user-admin-1"),
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe("Actor Permission Failures", () => {
    it("rejects non-manager actor trying to transition from PendingManager", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingManager;

      await expect(
        stateMachine.transition(
          "quot-1",
          QuotationState.PendingFinance,
          "user-rep-1", // SALES_REP not authorized
        ),
      ).rejects.toThrow(UnauthorizedTransitionError);
    });

    it("rejects non-finance actor trying to transition from PendingFinance to Approved", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingFinance;

      await expect(
        stateMachine.transition(
          "quot-1",
          QuotationState.Approved,
          "user-rep-1", // SALES_REP not authorized
        ),
      ).rejects.toThrow(UnauthorizedTransitionError);
    });
  });

  describe("State History Timeline Verification", () => {
    it("persists immutable audit history on each transition", async () => {
      await stateMachine.transition(
        "quot-1",
        QuotationState.Submitted,
        "user-rep-1",
        "Submission reason",
      );

      const logs = prisma._state.auditLogs;
      expect(logs.length).toBeGreaterThanOrEqual(1);

      const entry = logs.find((l: any) => l.entity === "QuotationState");
      expect(entry).toBeDefined();
      expect(entry.prevValue.state).toBe(QuotationState.Draft);
      expect(entry.userId).toBe("user-rep-1");
    });
  });
});
