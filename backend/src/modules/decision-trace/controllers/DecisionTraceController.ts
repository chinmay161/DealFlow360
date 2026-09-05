/**
 * DecisionTraceController
 *
 * Express request handlers for the Decision Trace API.
 *
 * Routes:
 *   GET /api/v1/quotations/:quotationId/decision-trace
 *   GET /api/v1/quotations/:quotationId/decision-trace/export
 *   GET /api/v1/decision-traces/search
 *
 * Error handling:
 *   - Quotation not found → 404
 *   - No evaluations      → 200 with { message: "No decision trace available." }
 *   - Validation failure   → 400
 *   - Unexpected errors    → 500 (logged, not exposed)
 */

import type { Request, Response } from "express";
import { createModuleLogger } from "../../../lib/logger.js";
import { DecisionTraceService, QuotationNotFoundError } from "../services/DecisionTraceService.js";
import {
  GetDecisionTraceQuerySchema,
  SearchDecisionTraceQuerySchema,
  ExportDecisionTraceQuerySchema,
  QuotationIdParamSchema,
} from "../dto/dto.js";
import type { ExportFormat } from "../types/types.js";

const log = createModuleLogger("decision-trace-controller");

export class DecisionTraceController {
  constructor(private readonly service: DecisionTraceService) {}

  /**
   * GET /api/v1/quotations/:quotationId/decision-trace
   */
  getDecisionTrace = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate path params
      const paramResult = QuotationIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid path parameters",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      // Validate query params
      const queryResult = GetDecisionTraceQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: queryResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { quotationId } = paramResult.data;
      const { format, ...filters } = queryResult.data;

      const trace = await this.service.getDecisionTrace(quotationId, {
        ...filters,
        format,
      });

      res.status(200).json(trace);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /api/v1/decision-traces/search
   */
  searchTraces = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryResult = SearchDecisionTraceQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: queryResult.error.flatten().fieldErrors,
        });
        return;
      }

      const results = await this.service.searchTraces(queryResult.data);
      res.status(200).json(results);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /api/v1/quotations/:quotationId/decision-trace/export
   */
  exportTrace = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate path params
      const paramResult = QuotationIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid path parameters",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      // Validate query params
      const queryResult = ExportDecisionTraceQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: queryResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { quotationId } = paramResult.data;
      const { format } = queryResult.data;

      const content = await this.service.exportTrace(
        quotationId,
        format as ExportFormat,
      );

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="decision-trace-${quotationId}.csv"`,
        );
      } else {
        res.setHeader("Content-Type", "application/json");
      }

      res.status(200).send(content);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ─── Error handling ────────────────────────────────────────────────────

  private handleError(error: unknown, res: Response): void {
    if (error instanceof QuotationNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }

    log.error({ error }, "Unexpected error in decision-trace controller");
    res.status(500).json({ error: "Internal server error" });
  }
}
