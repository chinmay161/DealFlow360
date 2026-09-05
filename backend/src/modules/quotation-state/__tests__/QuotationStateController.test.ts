import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuotationStateController } from "../controllers/QuotationStateController.js";
import { QuotationState } from "../types/types.js";
import {
  InvalidTransitionError,
  QuotationNotFoundError,
  ApprovalIncompleteError,
} from "../utils/errors.js";

function mockReq(
  params: Record<string, string> = {},
  body: Record<string, any> = {},
  query: Record<string, string> = {},
  headers: Record<string, string> = {},
) {
  return { params, body, query, headers } as any;
}

function mockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("QuotationStateController", () => {
  let mockStateMachine: any;
  let mockHistoryService: any;
  let controller: QuotationStateController;

  beforeEach(() => {
    mockStateMachine = {
      transition: vi.fn(),
    };
    mockHistoryService = {
      getHistory: vi.fn(),
      recordTransition: vi.fn(),
    };
    controller = new QuotationStateController(mockStateMachine, mockHistoryService);
  });

  describe("POST /api/v1/quotations/:id/transition", () => {
    it("returns 200 on successful transition", async () => {
      mockStateMachine.transition.mockResolvedValueOnce({
        success: true,
        quotationId: "quot-1",
        previousState: QuotationState.Draft,
        currentState: QuotationState.Submitted,
        actorId: "user-rep-1",
        timestamp: new Date(),
        reason: "User submitted quotation",
        message: 'Quotation successfully transitioned from "Draft" to "Submitted".',
        executionTimeMs: 12,
      });

      const req = mockReq(
        { id: "quot-1" },
        { targetState: "Submitted", reason: "User submitted quotation" },
        {},
        { "x-user-id": "user-rep-1" },
      );
      const res = mockRes();

      await controller.transition(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          currentState: QuotationState.Submitted,
        }),
      );
      expect(mockStateMachine.transition).toHaveBeenCalledWith(
        "quot-1",
        "Submitted",
        "user-rep-1",
        "User submitted quotation",
      );
    });

    it("returns 400 when request body is missing targetState", async () => {
      const req = mockReq({ id: "quot-1" }, { reason: "Missing target state" });
      const res = mockRes();

      await controller.transition(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid transition request body",
        }),
      );
    });

    it("returns 404 when quotation is not found", async () => {
      mockStateMachine.transition.mockRejectedValueOnce(
        new QuotationNotFoundError("quot-missing"),
      );

      const req = mockReq(
        { id: "quot-missing" },
        { targetState: "Submitted" },
      );
      const res = mockRes();

      await controller.transition(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "QUOTATION_NOT_FOUND",
        }),
      );
    });

    it("returns 409 when invalid transition is attempted", async () => {
      mockStateMachine.transition.mockRejectedValueOnce(
        new InvalidTransitionError(QuotationState.Draft, QuotationState.Fulfilled),
      );

      const req = mockReq(
        { id: "quot-1" },
        { targetState: "Fulfilled" },
      );
      const res = mockRes();

      await controller.transition(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_STATE_TRANSITION",
        }),
      );
    });

    it("returns 409 when approval is incomplete", async () => {
      mockStateMachine.transition.mockRejectedValueOnce(
        new ApprovalIncompleteError("quot-1", 1, "Pending Manager stage"),
      );

      const req = mockReq(
        { id: "quot-1" },
        { targetState: "Approved" },
      );
      const res = mockRes();

      await controller.transition(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "APPROVAL_INCOMPLETE",
        }),
      );
    });
  });

  describe("GET /api/v1/quotations/:id/history", () => {
    it("returns 200 with full transition timeline", async () => {
      const mockHistory = [
        {
          id: "hist-1",
          quotationId: "quot-1",
          previousState: QuotationState.Draft,
          nextState: QuotationState.Submitted,
          actorId: "user-rep-1",
          timestamp: new Date("2026-01-01T10:00:00Z"),
          reason: "User submitted quotation",
        },
      ];

      mockHistoryService.getHistory.mockResolvedValueOnce(mockHistory);

      const req = mockReq({ id: "quot-1" });
      const res = mockRes();

      await controller.getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        quotationId: "quot-1",
        totalEntries: 1,
        history: mockHistory,
      });
    });
  });
});
