/**
 * AuditContextBuilder
 *
 * Extracts contextual metadata (requestId, userId, ipAddress, userAgent, startTime)
 * from incoming HTTP requests to enrich audit log records.
 */

import crypto from "node:crypto";
import type { Request } from "express";
import type { IAuditContextBuilder } from "../interfaces/interfaces.js";
import type { AuditContext } from "../types/types.js";

export class AuditContextBuilder implements IAuditContextBuilder {
  /**
   * Extract or generate unique request/correlation ID.
   */
  extractRequestId(req: Request): string {
    const headerId =
      (req.headers["x-request-id"] as string) ||
      (req.headers["x-correlation-id"] as string);
    if (headerId && headerId.trim().length > 0) {
      return headerId.trim();
    }
    return crypto.randomUUID();
  }

  /**
   * Extract client IP address from proxy headers or socket.
   */
  extractIpAddress(req: Request): string | undefined {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim().length > 0) {
      return forwarded.split(",")[0].trim();
    }
    if (req.ip) {
      return req.ip;
    }
    if (req.socket?.remoteAddress) {
      return req.socket.remoteAddress;
    }
    return undefined;
  }

  /**
   * Extract client User-Agent string.
   */
  extractUserAgent(req: Request): string | undefined {
    const ua = req.headers["user-agent"] as string | undefined;
    return ua && ua.trim().length > 0 ? ua : undefined;
  }

  /**
   * Extract authenticated or asserted User ID.
   */
  extractUserId(req: Request): string | null {
    if (req.user?.id) {
      return req.user.id;
    }

    const headerUserId =
      (req.headers["x-user-id"] as string) ||
      (req.headers["x-actor-id"] as string);

    if (headerUserId && headerUserId.trim().length > 0) {
      return headerUserId.trim();
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        return token;
      }
    }

    return null;
  }

  /**
   * Build AuditContext from an Express request.
   */
  buildContext(req: Request): AuditContext {
    return {
      requestId: this.extractRequestId(req),
      userId: this.extractUserId(req),
      ipAddress: this.extractIpAddress(req) ?? null,
      userAgent: this.extractUserAgent(req) ?? null,
      startTime: Date.now(),
    };
  }
}
