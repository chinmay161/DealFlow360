/**
 * AuditMiddleware
 *
 * Captures request metadata (requestId, userId, ipAddress, userAgent, execution duration)
 * and attaches an AuditContext to Express requests.
 */

import type { Request, Response, NextFunction } from "express";
import { AuditContextBuilder } from "../services/AuditContextBuilder.js";
import type { AuditContext } from "../types/types.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("audit-middleware");

declare global {
  namespace Express {
    interface Request {
      auditContext?: AuditContext;
    }
  }
}

export function auditMiddleware(builder = new AuditContextBuilder()) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = builder.buildContext(req);
    req.auditContext = context;

    // Attach request ID to response header for client traceability
    res.setHeader("x-request-id", context.requestId);

    res.on("finish", () => {
      const duration = Math.round((performance.now() - context.startTime) * 100) / 100;
      log.debug(
        {
          requestId: context.requestId,
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          userId: context.userId,
          ip: context.ipAddress,
          durationMs: duration,
        },
        "HTTP request completed",
      );
    });

    next();
  };
}
