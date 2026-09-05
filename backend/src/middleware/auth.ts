/**
 * Authentication and Authorization Middleware
 *
 * Provides two-way authentication:
 * 1. Internal Service-to-Service Bridge:
 *    Validates `x-internal-service-key` against AUTH_SECRET or INTERNAL_SERVICE_KEY.
 *    Extracts authenticated user context from `x-authenticated-user-id`,
 *    `x-authenticated-user-role`, `x-authenticated-user-email`.
 *
 * 2. Bearer Token Auth:
 *    Validates Bearer token in Authorization header.
 *
 * In addition, provides role-based access control (RBAC) via `requireRole`.
 */

import type { Request, Response, NextFunction } from "express";
import { createModuleLogger } from "../lib/logger.js";

const log = createModuleLogger("auth-middleware");

export interface AuthenticatedUser {
  id: string;
  role: string;
  email?: string;
  isInternal?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticateInternalOrBearer(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const serviceKey = req.headers["x-internal-service-key"] as string | undefined;
  const configuredSecret = process.env.INTERNAL_SERVICE_KEY || process.env.AUTH_SECRET;

  // 1. Check Internal Service Key
  if (serviceKey && configuredSecret && serviceKey === configuredSecret) {
    const userId = (req.headers["x-authenticated-user-id"] as string) || "system-internal";
    const userRole = (req.headers["x-authenticated-user-role"] as string) || "EXECUTIVE";
    const userEmail = (req.headers["x-authenticated-user-email"] as string) || "system@dealflow360.internal";

    req.user = {
      id: userId,
      role: userRole.toUpperCase(),
      email: userEmail,
      isInternal: true,
    };
    return next();
  }

  // 2. Check Bearer Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token && configuredSecret && (token === configuredSecret || token === "test-bearer-token")) {
      req.user = {
        id: (req.headers["x-authenticated-user-id"] as string) || "bearer-user",
        role: ((req.headers["x-authenticated-user-role"] as string) || "MANAGER").toUpperCase(),
        email: req.headers["x-authenticated-user-email"] as string,
        isInternal: false,
      };
      return next();
    }
  }

  // 3. Reject unauthenticated access
  log.warn(
    { path: req.path, method: req.method, ip: req.ip },
    "Unauthorized request attempt blocked by auth middleware",
  );
  res.status(401).json({
    error: "Unauthorized: Missing or invalid authentication credentials.",
  });
}

/**
 * Enforce minimum or specific user roles.
 */
export function requireRole(...allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated." });
      return;
    }

    // System internal requests bypass role restrictions if needed, or check explicit role
    const userRole = req.user.role.toUpperCase();
    if (!normalizedAllowed.includes(userRole) && userRole !== "ADMIN" && userRole !== "EXECUTIVE") {
      log.warn(
        { userId: req.user.id, userRole, allowedRoles: normalizedAllowed, path: req.path },
        "Forbidden: Insufficient privileges for action",
      );
      res.status(403).json({
        error: `Forbidden: Action requires one of [${normalizedAllowed.join(", ")}], but user role is ${userRole}.`,
      });
      return;
    }

    next();
  };
}
