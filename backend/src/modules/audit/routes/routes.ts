/**
 * Audit Logging Module — Express Routes
 *
 * Mounts:
 *   GET /api/v1/audit
 *   GET /api/v1/audit/entity/:entity/:entityId
 *   GET /api/v1/audit/user/:userId
 *
 * All query endpoints require ADMIN role.
 */

import { Router } from "express";
import { AuditController } from "../controllers/AuditController.js";
import { AuditQueryService } from "../services/AuditQueryService.js";
import { requireAdmin } from "../middleware/auth.js";
import { prisma } from "../../../lib/prisma.js";
import type { IAuditQueryService } from "../interfaces/interfaces.js";

export function createAuditRouter(options?: {
  queryService?: IAuditQueryService;
}): Router {
  const router = Router();

  const queryService =
    options?.queryService ?? new AuditQueryService(prisma);

  const controller = new AuditController(queryService);

  // All audit query endpoints are strictly Admin-only
  router.get("/api/v1/audit", requireAdmin, controller.query);
  router.get("/api/v1/audit/entity/:entity/:entityId", requireAdmin, controller.getEntityTimeline);
  router.get("/api/v1/audit/user/:userId", requireAdmin, controller.getUserActivity);

  return router;
}
