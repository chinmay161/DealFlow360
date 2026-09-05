/**
 * CounterfactualController
 *
 * Express HTTP handlers for the Counterfactual Engine API.
 *
 * Endpoints:
 *   GET  /api/v1/quotations/:quotationId/recommendations
 *   POST /api/v1/recommendations/simulate
 */

import type { Request, Response } from "express";
import { CounterfactualEngine } from "../services/CounterfactualEngine.js";
import {
  QuotationIdParamSchema,
  SimulateRecommendationSchema,
} from "../dto/dto.js";
import {
  CounterfactualError,
  QuotationNotFoundError,
  InvalidSimulationError,
} from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("counterfactual-controller");

export class CounterfactualController {
  constructor(private readonly service: CounterfactualEngine) {}

  /**
   * GET /api/v1/quotations/:quotationId/recommendations
   */
  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const paramResult = QuotationIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid path parameters",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { quotationId } = paramResult.data;
      const result = await this.service.generateRecommendations(quotationId);

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "getRecommendations", params: req.params });
    }
  };

  /**
   * POST /api/v1/recommendations/simulate
   */
  simulate = async (req: Request, res: Response): Promise<void> => {
    try {
      const bodyResult = SimulateRecommendationSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid request payload",
          details: bodyResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { quotationId, changes } = bodyResult.data;
      const result = await this.service.simulate(quotationId, changes);

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "simulate", body: req.body });
    }
  };

  /**
   * Centralized error handler mapping domain errors to appropriate HTTP status codes.
   */
  private handleError(
    error: unknown,
    res: Response,
    context?: Record<string, unknown>,
  ): void {
    if (error instanceof QuotationNotFoundError) {
      log.warn({ ...context, error: error.message }, "Quotation not found");
      res.status(404).json({ error: error.message });
      return;
    }

    if (error instanceof InvalidSimulationError) {
      log.warn({ ...context, error: error.message, details: error.details }, "Invalid simulation requested");
      res.status(422).json({ error: error.message, details: error.details });
      return;
    }

    if (error instanceof CounterfactualError) {
      log.warn({ ...context, statusCode: error.statusCode, error: error.message }, "Counterfactual domain error");
      res.status(error.statusCode).json({ error: error.message, details: error.details });
      return;
    }

    log.error({ ...context, error }, "Unexpected error in CounterfactualController");
    res.status(500).json({ error: "Internal server error" });
  }
}
