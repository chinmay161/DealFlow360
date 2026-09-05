import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { CounterfactualController } from "../controllers/CounterfactualController.js";
import { CounterfactualEngine } from "../services/CounterfactualEngine.js";
import { QuotationNotFoundError, InvalidSimulationError } from "../utils/errors.js";
import { ApprovalLevel } from "../../rule-engine/interfaces/Rule.js";

describe("CounterfactualController", () => {
  let mockEngine: CounterfactualEngine;
  let controller: CounterfactualController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let responseData: any;
  let statusCode: number;

  beforeEach(() => {
    mockEngine = {
      generateRecommendations: vi.fn(),
      simulate: vi.fn(),
    } as unknown as CounterfactualEngine;

    controller = new CounterfactualController(mockEngine);
    statusCode = 200;
    responseData = null;

    mockRes = {
      status: vi.fn().mockImplementation((code: number) => {
        statusCode = code;
        return mockRes;
      }),
      json: vi.fn().mockImplementation((data: any) => {
        responseData = data;
        return mockRes;
      }),
    };
  });

  describe("getRecommendations", () => {
    it("returns 200 with recommendations", async () => {
      const mockResult = {
        quotationId: "quot-1",
        currentDecision: "Finance approval required",
        recommendations: [],
      };
      (mockEngine.generateRecommendations as any).mockResolvedValue(mockResult);

      mockReq = {
        params: { quotationId: "quot-1" },
      };

      await controller.getRecommendations(mockReq as Request, mockRes as Response);

      expect(statusCode).toBe(200);
      expect(responseData).toEqual(mockResult);
    });

    it("returns 404 when quotation is not found", async () => {
      (mockEngine.generateRecommendations as any).mockRejectedValue(
        new QuotationNotFoundError("quot-missing"),
      );

      mockReq = {
        params: { quotationId: "quot-missing" },
      };

      await controller.getRecommendations(mockReq as Request, mockRes as Response);

      expect(statusCode).toBe(404);
      expect(responseData.error).toContain("quot-missing");
    });

    it("returns 400 on invalid path parameter", async () => {
      mockReq = {
        params: { quotationId: "" },
      };

      await controller.getRecommendations(mockReq as Request, mockRes as Response);

      expect(statusCode).toBe(400);
      expect(responseData.error).toContain("Invalid path parameters");
    });

    it("returns 500 on unexpected error", async () => {
      (mockEngine.generateRecommendations as any).mockRejectedValue(
        new Error("Database connection dropped"),
      );

      mockReq = {
        params: { quotationId: "quot-1" },
      };

      await controller.getRecommendations(mockReq as Request, mockRes as Response);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe("Internal server error");
    });
  });

  describe("simulate", () => {
    it("returns 200 with simulated Rule Engine output", async () => {
      const mockSimResult = {
        quotationId: "quot-1",
        simulatedDecision: "Quotation auto-approved.",
        simulatedApprovalLevel: ApprovalLevel.AUTO_APPROVE,
        simulatedRiskScore: 15,
        approved: true,
        ruleEngineResult: {} as any,
        revenueImpact: 500,
        marginImpact: 0.02,
        executionTimeMs: 12,
      };
      (mockEngine.simulate as any).mockResolvedValue(mockSimResult);

      mockReq = {
        body: {
          quotationId: "quot-1",
          changes: [
            {
              lineId: "l1",
              field: "discountPct",
              value: 0.10,
            },
          ],
        },
      };

      await controller.simulate(mockReq as Request, mockRes as Response);

      expect(statusCode).toBe(200);
      expect(responseData).toEqual(mockSimResult);
    });

    it("returns 400 when body payload is invalid (missing changes)", async () => {
      mockReq = {
        body: {
          quotationId: "quot-1",
          changes: [],
        },
      };

      await controller.simulate(mockReq as Request, mockRes as Response);

      expect(statusCode).toBe(400);
      expect(responseData.error).toContain("Invalid request payload");
    });

    it("returns 404 when quotation is not found during simulation", async () => {
      (mockEngine.simulate as any).mockRejectedValue(
        new QuotationNotFoundError("quot-unknown"),
      );

      mockReq = {
        body: {
          quotationId: "quot-unknown",
          changes: [{ lineId: "l1", field: "discountPct", value: 0.10 }],
        },
      };

      await controller.simulate(mockReq as Request, mockRes as Response);

      expect(statusCode).toBe(404);
      expect(responseData.error).toContain("quot-unknown");
    });

    it("returns 422 when simulation changes are invalid", async () => {
      (mockEngine.simulate as any).mockRejectedValue(
        new InvalidSimulationError("Line does not exist in quotation"),
      );

      mockReq = {
        body: {
          quotationId: "quot-1",
          changes: [{ lineId: "l999", field: "discountPct", value: 0.10 }],
        },
      };

      await controller.simulate(mockReq as Request, mockRes as Response);

      expect(statusCode).toBe(422);
      expect(responseData.error).toContain("Line does not exist");
    });
  });
});
