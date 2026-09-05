/**
 * AuditMiddleware Test Suite
 *
 * Tests:
 * - Attachment of auditContext to Express Request
 * - Injection of x-request-id header into response
 * - Registration of finish listener with duration computation
 */

import { describe, it, expect, vi } from "vitest";
import { auditMiddleware } from "../middleware/AuditMiddleware.js";
import { EventEmitter } from "events";

describe("AuditMiddleware", () => {
  it("should populate req.auditContext and set x-request-id response header", () => {
    const middleware = auditMiddleware();

    const req: any = {
      headers: {
        "x-request-id": "req-xyz-123",
        "user-agent": "SuperTest",
      },
      ip: "127.0.0.1",
    };

    const headersSet: Record<string, string> = {};
    const res: any = new EventEmitter();
    res.setHeader = vi.fn((key: string, val: string) => {
      headersSet[key] = val;
    });
    res.statusCode = 200;

    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.auditContext).toBeDefined();
    expect(req.auditContext.requestId).toBe("req-xyz-123");
    expect(req.auditContext.ipAddress).toBe("127.0.0.1");
    expect(headersSet["x-request-id"]).toBe("req-xyz-123");
  });

  it("should calculate duration on response finish without errors", () => {
    const middleware = auditMiddleware();

    const req: any = {
      headers: {},
      method: "GET",
      originalUrl: "/api/v1/quotations",
    };

    const res: any = new EventEmitter();
    res.setHeader = vi.fn();
    res.statusCode = 200;

    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();

    // Trigger finish event
    expect(() => {
      res.emit("finish");
    }).not.toThrow();
  });
});
