/**
 * QuotationStateController
 *
 * Express handlers for quotation state machine endpoints:
 *   POST /api/v1/quotations/:id/transition
 *   GET  /api/v1/quotations/:id/history
 */

import type { Request, Response } from "express";
import type { IQuotationStateMachine, IStateHistoryService } from "../interfaces/interfaces.js";
import {
  TransitionRequestSchema,
  QuotationIdParamSchema,
} from "../dto/dto.js";
import { QuotationStateError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("quotation-state-controller");

export class QuotationStateController {
  constructor(
    private readonly stateMachine: IQuotationStateMachine,
    private readonly historyService: IStateHistoryService,
  ) {}

  /**
   * POST /api/v1/quotations/:id/transition
   */
  transition = async (req: Request, res: Response): Promise<void> => {
    const startTime = performance.now();
    try {
      // Validate path parameter
      const paramResult = QuotationIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid quotation ID parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      // Validate body
      const bodyResult = TransitionRequestSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid transition request body",
          details: bodyResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { id: quotationId } = paramResult.data;
      const { targetState, reason } = bodyResult.data;

      // Extract actor ID from payload, auth context, or headers
      const actorId =
        bodyResult.data.actorId ??
        (req as any).user?.id ??
        (req.headers["x-user-id"] as string) ??
        (req.headers["x-actor-id"] as string) ??
        "system";

      const result = await this.stateMachine.transition(
        quotationId,
        targetState,
        actorId,
        reason,
      );

      const executionTimeMs = Math.round(performance.now() - startTime);

      res.status(200).json({
        ...result,
        executionTimeMs,
      });
    } catch (error) {
      this.handleError(error, res, { action: "transition", params: req.params, body: req.body });
    }
  };

  /**
   * GET /api/v1/quotations/:id/history
   */
  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const paramResult = QuotationIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid quotation ID parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { id: quotationId } = paramResult.data;
      const timeline = await this.historyService.getHistory(quotationId);

      res.status(200).json({
        quotationId,
        totalEntries: timeline.length,
        history: timeline,
      });
    } catch (error) {
      this.handleError(error, res, { action: "getHistory", params: req.params });
    }
  };

  /**
   * Deterministic domain error handling.
   */
  private handleError(error: unknown, res: Response, meta: Record<string, any>): void {
    if (error instanceof QuotationStateError) {
      log.warn(
        { ...meta, error: error.message, code: error.code, statusCode: error.statusCode },
        "Handled domain error in QuotationStateController",
      );
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
      return;
    }

    log.error({ ...meta, error }, "Unhandled server error in QuotationStateController");
    res.status(500).json({
      error: "Internal server error occurred while processing quotation state.",
    });
  }
}
