/**
 * Decision Trace — Routes
 *
 * Mounts all decision-trace endpoints on an Express Router.
 *
 * Endpoints:
 *   GET /api/v1/quotations/:quotationId/decision-trace
 *   GET /api/v1/quotations/:quotationId/decision-trace/export
 *   GET /api/v1/decision-traces/search
 */

import { Router } from "express";
import { DecisionTraceController } from "../controllers/DecisionTraceController.js";
import { DecisionTraceService } from "../services/DecisionTraceService.js";
import { prisma } from "../../../lib/prisma.js";

/**
 * Create and return the decision-trace router.
 * Wires up the controller with a real Prisma-backed service.
 */
export function createDecisionTraceRouter(): Router {
  const router = Router();
  const service = new DecisionTraceService(prisma);
  const controller = new DecisionTraceController(service);

  // Quotation-scoped endpoints
  router.get(
    "/api/v1/quotations/:quotationId/decision-trace/export",
    controller.exportTrace,
  );
  router.get(
    "/api/v1/quotations/:quotationId/decision-trace",
    controller.getDecisionTrace,
  );

  // Cross-quotation search
  router.get(
    "/api/v1/decision-traces/search",
    controller.searchTraces,
  );

  return router;
}
