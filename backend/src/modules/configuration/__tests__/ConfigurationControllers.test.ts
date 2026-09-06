import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiscountPolicyController } from "../controllers/DiscountPolicyController.js";
import { ApprovalRuleController } from "../controllers/ApprovalRuleController.js";
import { requireAdmin, requireReadAccess } from "../middleware/auth.js";
import {
  ValidationError,
  DuplicateEntityError,
  EntityNotFoundError,
} from "../utils/errors.js";

function mockReq(
  params: Record<string, string> = {},
  body: Record<string, any> = {},
  query: Record<string, any> = {},
  headers: Record<string, string> = {},
  user?: any,
) {
  return { params, body, query, headers, user } as any;
}

function mockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("Configuration Controllers & Auth Middleware", () => {
  let mockPolicyService: any;
  let mockRuleService: any;
  let policyController: DiscountPolicyController;
  let ruleController: ApprovalRuleController;

  beforeEach(() => {
    mockPolicyService = {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockRuleService = {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    policyController = new DiscountPolicyController(mockPolicyService);
    ruleController = new ApprovalRuleController(mockRuleService);
  });

  describe("DiscountPolicyController Endpoints", () => {
    it("POST /api/v1/config/discount-policies returns 201 on success", async () => {
      mockPolicyService.create.mockResolvedValueOnce({
        id: "policy-new",
        productCategory: "Hardware",
        maximumDiscount: 0.15,
        minimumMargin: 0.20,
      });

      const req = mockReq(
        {},
        {
          productCategory: "Hardware",
          maximumDiscount: 0.15,
          minimumMargin: 0.20,
        },
        {},
        {},
        { id: "admin-1", role: "ADMIN" },
      );
      const res = mockRes();

      await policyController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: "policy-new" }),
      );
    });

    it("POST returns 400 on schema validation failure", async () => {
      const req = mockReq({}, { maximumDiscount: -1 });
      const res = mockRes();

      await policyController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid discount policy payload" }),
      );
    });

    it("POST returns 409 when service detects duplicate or overlap", async () => {
      mockPolicyService.create.mockRejectedValueOnce(
        new DuplicateEntityError("DiscountPolicy", "Hardware Gold"),
      );

      const req = mockReq({}, { productCategory: "Hardware", maximumDiscount: 0.15, minimumMargin: 0.20 });
      const res = mockRes();

      await policyController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "DUPLICATE_ENTITY" }),
      );
    });

    it("GET /:id returns 404 when policy not found", async () => {
      mockPolicyService.getById.mockRejectedValueOnce(
        new EntityNotFoundError("DiscountPolicy", "p-999"),
      );

      const req = mockReq({ id: "p-999" });
      const res = mockRes();

      await policyController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "NOT_FOUND" }),
      );
    });
  });

  describe("ApprovalRuleController Endpoints", () => {
    it("POST /api/v1/config/approval-rules returns 201 on success", async () => {
      mockRuleService.create.mockResolvedValueOnce({
        id: "rule-new",
        approvalLevel: "MANAGER",
        stage: 1,
        threshold: 0.15,
      });

      const req = mockReq(
        {},
        {
          approvalLevel: "MANAGER",
          stage: 1,
          threshold: 0.15,
        },
        {},
        {},
        { id: "admin-1", role: "ADMIN" },
      );
      const res = mockRes();

      await ruleController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: "rule-new" }),
      );
    });
  });

  describe("Authorization Middleware", () => {
    it("allows Admin to perform write operations (requireAdmin)", () => {
      const req = mockReq({}, {}, {}, {}, { id: "admin-1", role: "ADMIN" });
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("allows Manager to perform write operations (requireAdmin)", () => {
      const req = mockReq({}, {}, {}, {}, { id: "mgr-1", role: "MANAGER" });
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("blocks Sales user from write operations with 403 (requireAdmin)", () => {
      const req = mockReq({}, {}, {}, {}, { id: "rep-1", role: "SALES_REP" });
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });

    it("allows Manager and Sales users read-only access (requireReadAccess)", () => {
      const req1 = mockReq({}, {}, {}, {}, { id: "mgr-1", role: "MANAGER" });
      const res1 = mockRes();
      const next1 = vi.fn();
      requireReadAccess(req1, res1, next1);
      expect(next1).toHaveBeenCalled();

      const req2 = mockReq({}, {}, {}, {}, { id: "rep-1", role: "SALES_REP" });
      const res2 = mockRes();
      const next2 = vi.fn();
      requireReadAccess(req2, res2, next2);
      expect(next2).toHaveBeenCalled();
    });

    it("returns 401 when request is completely unauthenticated", () => {
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
