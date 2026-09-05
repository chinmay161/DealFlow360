/**
 * AuditController & Auth Middleware Test Suite
 *
 * Tests:
 * - Query endpoint: valid params, invalid params (400), pagination
 * - Entity timeline endpoint: valid params, missing params
 * - User activity endpoint: valid params, missing params
 * - RBAC & Admin-only authorization (200, 401, 403)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditController } from "../controllers/AuditController.js";
import { requireAdmin, extractUser } from "../middleware/auth.js";
import type { IAuditQueryService } from "../interfaces/interfaces.js";

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

describe("AuditController & Auth Middleware", () => {
  let mockQueryService: IAuditQueryService;
  let controller: AuditController;

  beforeEach(() => {
    mockQueryService = {
      query: vi.fn().mockResolvedValue({
        items: [
          {
            id: "audit-1",
            userId: "usr-1",
            action: "QUOTATION_SUBMITTED",
            entity: "QUOTATION",
            entityId: "qt-100",
            metadata: { total: 50000 },
            createdAt: new Date("2026-03-01T12:00:00.000Z"),
          },
        ],
        totalCount: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasMore: false,
      }),
      getEntityTimeline: vi.fn().mockResolvedValue([
        {
          id: "audit-1",
          userId: "usr-1",
          action: "CREATE",
          entity: "QUOTATION",
          entityId: "qt-100",
          createdAt: new Date("2026-03-01T10:00:00.000Z"),
        },
      ]),
      getUserActivity: vi.fn().mockResolvedValue({
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasMore: false,
      }),
    };

    controller = new AuditController(mockQueryService);
  });

  describe("query()", () => {
    it("should return 200 with paginated audit logs for valid query", async () => {
      const req = mockReq({}, {}, { entity: "QUOTATION", page: "1", limit: "20" });
      const res = mockRes();

      await controller.query(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockQueryService.query).toHaveBeenCalledWith(
        expect.objectContaining({ entity: "QUOTATION" }),
        expect.objectContaining({ page: 1, limit: 20 }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ totalCount: 1, items: expect.any(Array) }),
      );
    });

    it("should return 400 when limit exceeds maximum of 100", async () => {
      const req = mockReq({}, {}, { limit: "150" });
      const res = mockRes();

      await controller.query(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid audit query parameters" }),
      );
      expect(mockQueryService.query).not.toHaveBeenCalled();
    });

    it("should return 400 when page is less than 1", async () => {
      const req = mockReq({}, {}, { page: "0" });
      const res = mockRes();

      await controller.query(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockQueryService.query).not.toHaveBeenCalled();
    });
  });

  describe("getEntityTimeline()", () => {
    it("should return 200 with timeline for specified entity", async () => {
      const req = mockReq({ entity: "QUOTATION", entityId: "qt-100" });
      const res = mockRes();

      await controller.getEntityTimeline(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockQueryService.getEntityTimeline).toHaveBeenCalledWith("QUOTATION", "qt-100");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "QUOTATION",
          entityId: "qt-100",
          totalEvents: 1,
          timeline: expect.any(Array),
        }),
      );
    });

    it("should return 400 if entity parameter is empty or missing", async () => {
      const req = mockReq({ entity: "", entityId: "qt-100" });
      const res = mockRes();

      await controller.getEntityTimeline(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockQueryService.getEntityTimeline).not.toHaveBeenCalled();
    });
  });

  describe("getUserActivity()", () => {
    it("should return 200 with user activity result", async () => {
      const req = mockReq({ userId: "usr-42" }, {}, { page: "1", limit: "10" });
      const res = mockRes();

      await controller.getUserActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockQueryService.getUserActivity).toHaveBeenCalledWith(
        "usr-42",
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "usr-42" }),
      );
    });

    it("should return 400 if userId parameter is empty", async () => {
      const req = mockReq({ userId: "" });
      const res = mockRes();

      await controller.getUserActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockQueryService.getUserActivity).not.toHaveBeenCalled();
    });
  });

  describe("requireAdmin Middleware", () => {
    it("should allow Admin user to access endpoint", () => {
      const req = mockReq({}, {}, {}, {}, { id: "admin-1", role: "ADMIN" });
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should allow Admin via x-user-id and x-user-role headers", () => {
      const req = mockReq({}, {}, {}, { "x-user-id": "admin-2", "x-user-role": "ADMIN" });
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should reject Manager with 403 Forbidden", () => {
      const req = mockReq({}, {}, {}, {}, { id: "mgr-1", role: "MANAGER" });
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });

    it("should reject Sales user with 403 Forbidden", () => {
      const req = mockReq({}, {}, {}, { "x-user-id": "rep-1", "x-user-role": "SALES_REP" });
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should reject unauthenticated request with 401 Unauthorized", () => {
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "UNAUTHORIZED" }),
      );
    });
  });
});
