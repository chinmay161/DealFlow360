/**
 * AuditContextBuilder Test Suite
 *
 * Tests:
 * - Request ID extraction & fallback generation
 * - Client IP extraction (x-forwarded-for, req.ip, socket)
 * - User-Agent extraction
 * - User ID extraction (req.user, headers, Authorization token)
 * - Complete context object assembly
 */

import { describe, it, expect } from "vitest";
import { AuditContextBuilder } from "../services/AuditContextBuilder.js";

describe("AuditContextBuilder", () => {
  const builder = new AuditContextBuilder();

  describe("extractRequestId()", () => {
    it("should extract requestId from x-request-id header", () => {
      const req: any = {
        headers: { "x-request-id": "req-custom-999" },
      };
      expect(builder.extractRequestId(req)).toBe("req-custom-999");
    });

    it("should generate a fallback UUID if x-request-id header is missing", () => {
      const req: any = { headers: {} };
      const reqId = builder.extractRequestId(req);
      expect(reqId).toBeDefined();
      expect(typeof reqId).toBe("string");
      expect(reqId.length).toBeGreaterThan(10);
    });
  });

  describe("extractIpAddress()", () => {
    it("should extract client IP from x-forwarded-for header (first in list)", () => {
      const req: any = {
        headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
      };
      expect(builder.extractIpAddress(req)).toBe("203.0.113.195");
    });

    it("should fall back to req.ip if header not provided", () => {
      const req: any = {
        headers: {},
        ip: "10.0.0.1",
      };
      expect(builder.extractIpAddress(req)).toBe("10.0.0.1");
    });

    it("should fall back to req.socket.remoteAddress if req.ip not available", () => {
      const req: any = {
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      };
      expect(builder.extractIpAddress(req)).toBe("127.0.0.1");
    });
  });

  describe("extractUserAgent()", () => {
    it("should extract user agent header", () => {
      const req: any = {
        headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      };
      expect(builder.extractUserAgent(req)).toBe("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    });

    it("should return undefined if user agent header is missing", () => {
      const req: any = { headers: {} };
      expect(builder.extractUserAgent(req)).toBeUndefined();
    });
  });

  describe("extractUserId()", () => {
    it("should return req.user.id if available", () => {
      const req: any = {
        user: { id: "usr-admin-1" },
        headers: {},
      };
      expect(builder.extractUserId(req)).toBe("usr-admin-1");
    });

    it("should return x-user-id header if req.user is absent", () => {
      const req: any = {
        headers: { "x-user-id": "usr-header-2" },
      };
      expect(builder.extractUserId(req)).toBe("usr-header-2");
    });

    it("should return x-actor-id header if x-user-id is absent", () => {
      const req: any = {
        headers: { "x-actor-id": "actor-3" },
      };
      expect(builder.extractUserId(req)).toBe("actor-3");
    });

    it("should extract token from Bearer Authorization header", () => {
      const req: any = {
        headers: { authorization: "Bearer my-jwt-or-user-token" },
      };
      expect(builder.extractUserId(req)).toBe("my-jwt-or-user-token");
    });

    it("should return null if no user identifier is present", () => {
      const req: any = { headers: {} };
      expect(builder.extractUserId(req)).toBeNull();
    });
  });

  describe("buildContext()", () => {
    it("should assemble a complete AuditContext with startTime", () => {
      const req: any = {
        headers: {
          "x-request-id": "req-trace-42",
          "x-user-id": "usr-tester",
          "user-agent": "Vitest/1.0",
        },
        ip: "127.0.0.1",
      };

      const ctx = builder.buildContext(req);
      expect(ctx.requestId).toBe("req-trace-42");
      expect(ctx.userId).toBe("usr-tester");
      expect(ctx.ipAddress).toBe("127.0.0.1");
      expect(ctx.userAgent).toBe("Vitest/1.0");
      expect(typeof ctx.startTime).toBe("number");
      expect(ctx.startTime).toBeLessThanOrEqual(Date.now());
    });
  });
});
