/**
 * Counterfactual Engine — Express Routes
 *
 * Mounts:
 *   GET  /api/v1/quotations/:quotationId/recommendations
 *   POST /api/v1/recommendations/simulate
 */

import { Router } from "express";
import { CounterfactualController } from "../controllers/CounterfactualController.js";
import { CounterfactualEngine } from "../services/CounterfactualEngine.js";
import { prisma } from "../../../lib/prisma.js";

/**
 * Factory creating and returning the configured Express router for the Counterfactual Engine.
 */
export function createCounterfactualRouter(customService?: CounterfactualEngine): Router {
  const router = Router();
  const service = customService ?? new CounterfactualEngine(prisma);
  const controller = new CounterfactualController(service);

  // Recommendation generation for quotation
  router.get(
    "/api/v1/quotations/:quotationId/recommendations",
    controller.getRecommendations,
  );

  // Direct simulation endpoint
  router.post(
    "/api/v1/recommendations/simulate",
    controller.simulate,
  );

  return router;
}
