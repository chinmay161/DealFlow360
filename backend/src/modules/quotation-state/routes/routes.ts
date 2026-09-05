/**
 * Quotation State Machine — Express Routes
 *
 * Mounts:
 *   POST /api/v1/quotations/:id/transition
 *   GET  /api/v1/quotations/:id/history
 */

import { Router } from "express";
import { QuotationStateController } from "../controllers/QuotationStateController.js";
import { QuotationStateMachine } from "../services/QuotationStateMachine.js";
import { StateHistoryService } from "../services/StateHistoryService.js";
import { prisma } from "../../../lib/prisma.js";

/**
 * Router factory creating quotation state machine routes.
 */
export function createQuotationStateRouter(options?: {
  stateMachine?: QuotationStateMachine;
  historyService?: StateHistoryService;
}): Router {
  const router = Router();
  const historyService = options?.historyService ?? new StateHistoryService(prisma);
  const stateMachine = options?.stateMachine ?? new QuotationStateMachine(prisma, { historyService });
  const controller = new QuotationStateController(stateMachine, historyService);

  router.post("/api/v1/quotations/:id/transition", controller.transition);
  router.get("/api/v1/quotations/:id/history", controller.getHistory);

  return router;
}
