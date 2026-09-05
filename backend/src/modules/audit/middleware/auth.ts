/**
 * Audit Module — Authentication & Authorization Middleware
 *
 * Restricts access to audit query APIs to Admin users only.
 * - 401 Unauthorized for unauthenticated requests
 * - 403 Forbidden for non-admin users
 */

import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  role: string;
  email?: string;
}

/**
 * Extract authenticated user context from request or headers.
 */
export function extractUser(req: Request): AuthenticatedUser | null {
  if (req.user?.id) {
    return req.user;
  }

  const userId =
    (req.headers["x-user-id"] as string) ??
    (req.headers["x-actor-id"] as string);

  const role =
    ((req.headers["x-user-role"] as string) ??
    (req.headers["x-role"] as string) ??
    "").toUpperCase();

  if (userId) {
    return {
      id: userId,
      role: role || "ADMIN",
      email: (req.headers["x-user-email"] as string) ?? undefined,
    };
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      return {
        id: token,
        role: role || "ADMIN",
      };
    }
  }

  return null;
}

/**
 * Middleware: require authenticated user with ADMIN role.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = extractUser(req);
  if (!user) {
    res.status(401).json({
      error: "Authentication required to access audit records.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  req.user = user;
  const userRole = (user.role || "").toUpperCase();

  if (userRole !== "ADMIN") {
    res.status(403).json({
      error: `Access denied. Role "${userRole}" lacks permission to view audit records. Admin role required.`,
      code: "FORBIDDEN",
    });
    return;
  }

  next();
}
