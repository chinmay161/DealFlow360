import { describe, it, expect, beforeEach } from "vitest";
import { TransitionValidator } from "../services/TransitionValidator.js";
import { QuotationState } from "../types/types.js";
import {
  InvalidTransitionError,
  QuotationNotFoundError,
  ActorNotFoundError,
  UnauthorizedTransitionError,
  ApprovalIncompleteError,
} from "../utils/errors.js";
import {
  createMockPrisma,
  mockQuotation,
  mockUser,
  mockManagerUser,
  mockFinanceUser,
} from "./helpers.js";

describe("TransitionValidator", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let validator: TransitionValidator;

  beforeEach(() => {
    prisma = createMockPrisma();
    validator = new TransitionValidator(prisma);
  });

  describe("Allowed Transitions Graph", () => {
    it("permits valid direct transitions in the happy path", () => {
      expect(validator.isAllowedTransition(QuotationState.Draft, QuotationState.Submitted)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.Submitted, QuotationState.PendingManager)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.PendingManager, QuotationState.PendingFinance)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.PendingFinance, QuotationState.Approved)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.Approved, QuotationState.Reserved)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.Reserved, QuotationState.Fulfilled)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.Fulfilled, QuotationState.Closed)).toBe(true);
    });

    it("permits rejected and revision workflow transitions", () => {
      expect(validator.isAllowedTransition(QuotationState.PendingManager, QuotationState.Rejected)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.Rejected, QuotationState.ReturnedForRevision)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.ReturnedForRevision, QuotationState.Draft)).toBe(true);
      expect(validator.isAllowedTransition(QuotationState.ReturnedForRevision, QuotationState.Submitted)).toBe(true);
    });

    it("fails illegal transition: Draft -> Fulfilled with 409", async () => {
      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.Draft,
        targetState: QuotationState.Fulfilled,
        actorId: "user-rep-1",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(InvalidTransitionError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("fails illegal transition: Rejected -> Approved with 409", async () => {
      prisma._state.quotations[0].status = QuotationState.Rejected;

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.Rejected,
        targetState: QuotationState.Approved,
        actorId: "user-mgr-1",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(InvalidTransitionError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("fails illegal transition from terminal state: Closed -> Draft with 409", async () => {
      prisma._state.quotations[0].status = QuotationState.Closed;

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.Closed,
        targetState: QuotationState.Draft,
        actorId: "user-admin-1",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(InvalidTransitionError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("fails illegal transition from terminal state: Cancelled -> Draft with 409", async () => {
      prisma._state.quotations[0].status = QuotationState.Cancelled;

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.Cancelled,
        targetState: QuotationState.Draft,
        actorId: "user-admin-1",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(InvalidTransitionError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe("Quotation Existence Checks", () => {
    it("fails with 404 when quotation does not exist", async () => {
      const context = {
        quotationId: "quot-non-existent",
        currentState: QuotationState.Draft,
        targetState: QuotationState.Submitted,
        actorId: "user-rep-1",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(QuotationNotFoundError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("Actor & Permission Checks", () => {
    it("fails with 404 when actor is not found", async () => {
      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.Draft,
        targetState: QuotationState.Submitted,
        actorId: "user-ghost",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(ActorNotFoundError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("fails with 403 when non-manager attempts PendingManager decision", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingManager;

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.PendingManager,
        targetState: QuotationState.PendingFinance,
        actorId: "user-rep-1", // Sales Rep attempting manager transition
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(UnauthorizedTransitionError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("fails with 403 when non-finance attempts PendingFinance decision", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingFinance;

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.PendingFinance,
        targetState: QuotationState.Approved,
        actorId: "user-rep-1", // Sales Rep attempting finance transition
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(UnauthorizedTransitionError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("Approval Completion Checks", () => {
    it("fails with 409 when transitioning to Approved with pending approval stages", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingFinance;
      prisma._state.approvals.push({
        id: "appr-1",
        quotationId: "quot-1",
        stage: 2,
        status: "PENDING",
      });

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.PendingFinance,
        targetState: QuotationState.Approved,
        actorId: "user-fin-1",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(ApprovalIncompleteError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("fails with 409 when transitioning to Approved with rejected approval stage", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingManager;
      prisma._state.approvals.push({
        id: "appr-1",
        quotationId: "quot-1",
        stage: 1,
        status: "REJECTED",
      });

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.PendingManager,
        targetState: QuotationState.Approved,
        actorId: "user-mgr-1",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).rejects.toThrow(ApprovalIncompleteError);
      await expect(validator.validate(context)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("succeeds when all approval records are APPROVED", async () => {
      prisma._state.quotations[0].status = QuotationState.PendingFinance;
      prisma._state.approvals.push({
        id: "appr-1",
        quotationId: "quot-1",
        stage: 1,
        status: "APPROVED",
      });
      prisma._state.approvals.push({
        id: "appr-2",
        quotationId: "quot-1",
        stage: 2,
        status: "APPROVED",
      });

      const context = {
        quotationId: "quot-1",
        currentState: QuotationState.PendingFinance,
        targetState: QuotationState.Approved,
        actorId: "user-fin-1",
        timestamp: new Date(),
      };

      await expect(validator.validate(context)).resolves.not.toThrow();
    });
  });
});
