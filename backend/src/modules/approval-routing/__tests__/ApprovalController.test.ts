/**
 * ApprovalController — Unit Tests
 *
 * Tests Express request handlers with mocked ApprovalRoutingService.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApprovalController } from "../controllers/ApprovalController.js";
import { ApprovalRoutingService } from "../services/ApprovalRoutingService.js";
import {
  QuotationNotFoundError,
  ApprovalNotFoundError,
  ApprovalAlreadyCompletedError,
  UnauthorizedApproverError,
  SkippedStageError,
  InvalidWorkflowTransitionError,
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

describe("ApprovalController", () => {
  let mockService: any;
  let controller: ApprovalController;

  beforeEach(() => {
    mockService = {
      startWorkflow: vi.fn(),
      approve: vi.fn(),
      reject: vi.fn(),
      returnForRevision: vi.fn(),
      getWorkflowStatus: vi.fn(),
      getPendingApprovals: vi.fn(),
    };
    controller = new ApprovalController(mockService as unknown as ApprovalRoutingService);
  });

  // ─── startWorkflow ──────────────────────────────────────────────────────────

  describe("startWorkflow", () => {
    it("returns 201 on successful workflow start", async () => {
      mockService.startWorkflow.mockResolvedValue({
        quotationId: "quot-1",
        workflowStatus: "PENDING_APPROVAL",
        currentStage: 1,
        totalStages: 1,
      });

      const req = mockReq({}, { quotationId: "quot-1" });
      const res = mockRes();

      await controller.startWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ quotationId: "quot-1", workflowStatus: "PENDING_APPROVAL" }),
      );
    });

    it("returns 400 when quotationId is missing in body", async () => {
      const req = mockReq({}, {});
      const res = mockRes();

      await controller.startWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid request payload" }),
      );
    });

    it("returns 404 when quotation is not found", async () => {
      mockService.startWorkflow.mockRejectedValue(new QuotationNotFoundError("quot-999"));

      const req = mockReq({}, { quotationId: "quot-999" });
      const res = mockRes();

      await controller.startWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Quotation not found: quot-999" }),
      );
    });

    it("returns 422 on invalid workflow transition", async () => {
      mockService.startWorkflow.mockRejectedValue(
        new InvalidWorkflowTransitionError("APPROVED", "startWorkflow", "Already approved"),
      );

      const req = mockReq({}, { quotationId: "quot-1" });
      const res = mockRes();

      await controller.startWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  // ─── approve ────────────────────────────────────────────────────────────────

  describe("approve", () => {
    it("returns 200 on successful approval", async () => {
      mockService.approve.mockResolvedValue({
        quotationId: "quot-1",
        workflowStatus: "APPROVED",
        currentStage: null,
      });

      const req = mockReq(
        { approvalId: "appr-1" },
        { comments: "Looks good", approverId: "mgr-1" },
      );
      const res = mockRes();

      await controller.approve(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockService.approve).toHaveBeenCalledWith("appr-1", "mgr-1", "Looks good");
    });

    it("returns 409 when approval is already completed", async () => {
      mockService.approve.mockRejectedValue(
        new ApprovalAlreadyCompletedError("appr-1", "APPROVED"),
      );

      const req = mockReq({ approvalId: "appr-1" }, { approverId: "mgr-1" });
      const res = mockRes();

      await controller.approve(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("already been processed") }),
      );
    });

    it("returns 403 when user is unauthorized", async () => {
      mockService.approve.mockRejectedValue(
        new UnauthorizedApproverError("user-bad", "mgr-1"),
      );

      const req = mockReq({ approvalId: "appr-1" }, { approverId: "user-bad" });
      const res = mockRes();

      await controller.approve(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 422 when stage is skipped", async () => {
      mockService.approve.mockRejectedValue(new SkippedStageError(1, 2));

      const req = mockReq({ approvalId: "appr-2" }, { approverId: "fin-1" });
      const res = mockRes();

      await controller.approve(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it("returns 500 without stack trace on unexpected errors", async () => {
      mockService.approve.mockRejectedValue(new Error("Database connection lost"));

      const req = mockReq({ approvalId: "appr-1" }, { approverId: "mgr-1" });
      const res = mockRes();

      await controller.approve(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  // ─── reject ─────────────────────────────────────────────────────────────────

  describe("reject", () => {
    it("returns 200 on rejection", async () => {
      mockService.reject.mockResolvedValue({
        quotationId: "quot-1",
        workflowStatus: "REJECTED",
      });

      const req = mockReq(
        { approvalId: "appr-1" },
        { comments: "Violates discount ceiling", approverId: "mgr-1" },
      );
      const res = mockRes();

      await controller.reject(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockService.reject).toHaveBeenCalledWith(
        "appr-1",
        "mgr-1",
        "Violates discount ceiling",
      );
    });

    it("returns 400 if rejection comments are missing", async () => {
      const req = mockReq({ approvalId: "appr-1" }, {});
      const res = mockRes();

      await controller.reject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── returnForRevision ──────────────────────────────────────────────────────

  describe("returnForRevision", () => {
    it("returns 200 on return for revision", async () => {
      mockService.returnForRevision.mockResolvedValue({
        quotationId: "quot-1",
        workflowStatus: "DRAFT",
      });

      const req = mockReq(
        { approvalId: "appr-1" },
        { comments: "Please modify the tier pricing", approverId: "mgr-1" },
      );
      const res = mockRes();

      await controller.returnForRevision(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockService.returnForRevision).toHaveBeenCalledWith(
        "appr-1",
        "mgr-1",
        "Please modify the tier pricing",
      );
    });
  });

  // ─── getWorkflowStatus ──────────────────────────────────────────────────────

  describe("getWorkflowStatus", () => {
    it("returns 200 with status payload", async () => {
      mockService.getWorkflowStatus.mockResolvedValue({
        quotationId: "quot-1",
        workflowStatus: "PENDING_APPROVAL",
        currentStage: 1,
        totalStages: 2,
      });

      const req = mockReq({ quotationId: "quot-1" });
      const res = mockRes();

      await controller.getWorkflowStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ quotationId: "quot-1" }),
      );
    });

    it("returns 404 when quotation not found", async () => {
      mockService.getWorkflowStatus.mockRejectedValue(new QuotationNotFoundError("quot-none"));

      const req = mockReq({ quotationId: "quot-none" });
      const res = mockRes();

      await controller.getWorkflowStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── getPendingApprovals ────────────────────────────────────────────────────

  describe("getPendingApprovals", () => {
    it("returns 200 with matching approvals", async () => {
      mockService.getPendingApprovals.mockResolvedValue([
        { id: "appr-1", stage: 1, status: "PENDING" },
      ]);

      const req = mockReq({}, {}, { role: "MANAGER" });
      const res = mockRes();

      await controller.getPendingApprovals(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockService.getPendingApprovals).toHaveBeenCalledWith(
        expect.objectContaining({ role: "MANAGER" }),
      );
    });

    it("returns 400 for invalid role query parameter", async () => {
      const req = mockReq({}, {}, { role: "INVALID_ROLE" });
      const res = mockRes();

      await controller.getPendingApprovals(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
