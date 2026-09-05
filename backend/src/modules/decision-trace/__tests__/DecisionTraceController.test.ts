/**
 * DecisionTraceController — Unit Tests
 *
 * Tests Express request handlers with mocked service.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DecisionTraceController } from "../controllers/DecisionTraceController.js";
import { DecisionTraceService, QuotationNotFoundError } from "../services/DecisionTraceService.js";
import type { DecisionTraceResponse, EmptyTraceResponse } from "../interfaces/interfaces.js";

// ─── Mock Request / Response ─────────────────────────────────────────────────

function mockReq(params: Record<string, string> = {}, query: Record<string, string> = {}) {
  return { params, query } as any;
}

function mockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res;
}

// ─── Mock Service ────────────────────────────────────────────────────────────

function createMockService() {
  return {
    getDecisionTrace: vi.fn(),
    searchTraces: vi.fn(),
    exportTrace: vi.fn(),
  } as unknown as DecisionTraceService;
}

// ─── Mock Trace Response ─────────────────────────────────────────────────────

const mockTraceResponse: DecisionTraceResponse = {
  quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  overallDecision: "Finance approval required",
  overallRiskScore: 82,
  approvalLevel: "FINANCE",
  summary: "Finance approval required because\n- Discount exceeded\n2 rules triggered.",
  rules: [],
  decisionTree: [],
  timeline: [],
  statistics: {
    rulesEvaluated: 6,
    passed: 3,
    failed: 2,
    warnings: 1,
    executionTimeMs: 18,
  },
};

const mockEmptyResponse: EmptyTraceResponse = {
  message: "No decision trace available.",
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("DecisionTraceController", () => {
  let service: DecisionTraceService;
  let controller: DecisionTraceController;

  beforeEach(() => {
    service = createMockService();
    controller = new DecisionTraceController(service);
  });

  describe("getDecisionTrace", () => {
    it("returns 200 with trace data for valid quotation", async () => {
      (service.getDecisionTrace as any).mockResolvedValue(mockTraceResponse);
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        {},
      );
      const res = mockRes();

      await controller.getDecisionTrace(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTraceResponse);
    });

    it("returns 404 for non-existent quotation", async () => {
      (service.getDecisionTrace as any).mockRejectedValue(
        new QuotationNotFoundError("non-existent"),
      );
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        {},
      );
      const res = mockRes();

      await controller.getDecisionTrace(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("not found") }),
      );
    });

    it("returns 200 with empty-trace message when no evaluations exist", async () => {
      (service.getDecisionTrace as any).mockResolvedValue(mockEmptyResponse);
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        {},
      );
      const res = mockRes();

      await controller.getDecisionTrace(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockEmptyResponse);
    });

    it("returns 400 for invalid quotationId", async () => {
      const req = mockReq({ quotationId: "not-a-uuid" }, {});
      const res = mockRes();

      await controller.getDecisionTrace(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid path parameters" }),
      );
    });

    it("returns 400 for invalid query params", async () => {
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        { severity: "INVALID_SEVERITY" },
      );
      const res = mockRes();

      await controller.getDecisionTrace(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid query parameters" }),
      );
    });

    it("passes filter params to service", async () => {
      (service.getDecisionTrace as any).mockResolvedValue(mockTraceResponse);
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        { passed: "true", severity: "HIGH" },
      );
      const res = mockRes();

      await controller.getDecisionTrace(req, res);

      expect(service.getDecisionTrace).toHaveBeenCalledWith(
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        expect.objectContaining({
          passed: true,
          severity: "HIGH",
          format: "raw",
        }),
      );
    });

    it("returns 500 for unexpected errors", async () => {
      (service.getDecisionTrace as any).mockRejectedValue(
        new Error("Database connection lost"),
      );
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        {},
      );
      const res = mockRes();

      await controller.getDecisionTrace(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Internal server error" }),
      );
    });
  });

  describe("searchTraces", () => {
    it("returns 200 with search results", async () => {
      const mockResults = [{ ruleId: "test", ruleName: "Test Rule" }];
      (service.searchTraces as any).mockResolvedValue(mockResults);
      const req = mockReq({}, { outcome: "FAIL" });
      const res = mockRes();

      await controller.searchTraces(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });

    it("returns 400 for invalid search params", async () => {
      const req = mockReq({}, { outcome: "INVALID" });
      const res = mockRes();

      await controller.searchTraces(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("exportTrace", () => {
    it("returns JSON export with correct content type", async () => {
      (service.exportTrace as any).mockResolvedValue('{"quotationId":"quot-1"}');
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        { format: "json" },
      );
      const res = mockRes();

      await controller.exportTrace(req, res);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/json");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns CSV export with content-disposition header", async () => {
      (service.exportTrace as any).mockResolvedValue("ruleId,ruleName\ntest,Test");
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        { format: "csv" },
      );
      const res = mockRes();

      await controller.exportTrace(req, res);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        expect.stringContaining("attachment"),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when quotation not found during export", async () => {
      (service.exportTrace as any).mockRejectedValue(
        new QuotationNotFoundError("non-existent"),
      );
      const req = mockReq(
        { quotationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        { format: "json" },
      );
      const res = mockRes();

      await controller.exportTrace(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
