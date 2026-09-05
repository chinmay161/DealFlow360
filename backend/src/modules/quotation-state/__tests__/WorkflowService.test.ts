import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkflowService } from "../services/WorkflowService.js";
import { QuotationState } from "../types/types.js";
import { createMockPrisma } from "./helpers.js";

describe("WorkflowService", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let mockRuleEngine: any;
  let mockApprovalRoutingService: any;
  let mockNotifier: any;
  let workflowService: WorkflowService;

  beforeEach(() => {
    prisma = createMockPrisma();

    mockRuleEngine = {
      evaluate: vi.fn().mockResolvedValue({
        approved: true,
        approvalLevel: "MANAGER",
        overallRiskScore: 35,
        decision: "Quotation requires Manager approval",
      }),
    };

    mockApprovalRoutingService = {
      startWorkflow: vi.fn().mockResolvedValue({
        quotationId: "quot-1",
        workflowStatus: "PENDING_APPROVAL",
        approvalLevel: "MANAGER",
        currentStage: 1,
        totalStages: 1,
      }),
    };

    mockNotifier = {
      notifyStateChanged: vi.fn().mockResolvedValue(undefined),
      notifyReservationReady: vi.fn().mockResolvedValue(undefined),
    };

    workflowService = new WorkflowService(prisma, {
      ruleEngine: mockRuleEngine,
      approvalRoutingService: mockApprovalRoutingService,
      notifier: mockNotifier,
    });
  });

  describe("Submitted Transition Pipeline", () => {
    it("invokes Rule Engine, Approval Routing, and routes to PendingManager", async () => {
      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.Draft,
        targetState: QuotationState.Submitted,
        actorId: "user-rep-1",
        timestamp: new Date(),
      };

      const result = await workflowService.onTransition(context);

      expect(mockRuleEngine.evaluate).toHaveBeenCalledWith("quot-1", {
        persistTrace: true,
      });
      expect(mockApprovalRoutingService.startWorkflow).toHaveBeenCalledWith("quot-1", {
        ruleEngineResult: expect.objectContaining({ approvalLevel: "MANAGER" }),
      });
      expect(result.nextState).toBe(QuotationState.PendingManager);
      expect(result.autoAdvance).toBe(true);
    });

    it("routes directly to Approved if workflow result is auto-approved", async () => {
      mockApprovalRoutingService.startWorkflow.mockResolvedValueOnce({
        quotationId: "quot-1",
        workflowStatus: "APPROVED",
        approvalLevel: "AUTO",
        currentStage: null,
      });

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.Draft,
        targetState: QuotationState.Submitted,
        actorId: "user-rep-1",
        timestamp: new Date(),
      };

      const result = await workflowService.onTransition(context);

      expect(result.nextState).toBe(QuotationState.Approved);
      expect(result.autoAdvance).toBe(true);
    });

    it("routes directly to Rejected if rule engine rejects", async () => {
      mockApprovalRoutingService.startWorkflow.mockResolvedValueOnce({
        quotationId: "quot-1",
        workflowStatus: "REJECTED",
        approvalLevel: "REJECT",
        currentStage: null,
      });

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.Draft,
        targetState: QuotationState.Submitted,
        actorId: "user-rep-1",
        timestamp: new Date(),
      };

      const result = await workflowService.onTransition(context);

      expect(result.nextState).toBe(QuotationState.Rejected);
      expect(result.autoAdvance).toBe(true);
    });
  });

  describe("Approved Transition Hooks", () => {
    it("notifies downstream modules and signals reservation readiness", async () => {
      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.PendingFinance,
        targetState: QuotationState.Approved,
        actorId: "user-fin-1",
        timestamp: new Date(),
      };

      const result = await workflowService.onTransition(context);

      expect(mockNotifier.notifyStateChanged).toHaveBeenCalledWith(context);
      expect(mockNotifier.notifyReservationReady).toHaveBeenCalledWith("quot-1");
      expect(result.workflowDetails?.reservationReady).toBe(true);
    });
  });
});
