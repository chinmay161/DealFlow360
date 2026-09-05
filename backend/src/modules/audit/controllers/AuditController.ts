/**
 * AuditController
 *
 * Express handlers for audit query APIs:
 *   GET /api/v1/audit
 *   GET /api/v1/audit/entity/:entity/:entityId
 *   GET /api/v1/audit/user/:userId
 */

import type { Request, Response } from "express";
import type { IAuditQueryService } from "../interfaces/interfaces.js";
import {
  AuditQuerySchema,
  EntityTimelineParamSchema,
  UserIdParamSchema,
} from "../dto/dto.js";
import { AuditError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("audit-controller");

export class AuditController {
  constructor(private readonly queryService: IAuditQueryService) {}

  /**
   * GET /api/v1/audit
   * General search with filtering, sorting, and pagination.
   */
  query = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = AuditQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid audit query parameters",
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { action, entity, entityId, userId, from, to, page, limit } = parsed.data;
      const result = await this.queryService.query(
        { action, entity, entityId, userId, from, to },
        { page, limit },
      );

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "query", query: req.query });
    }
  };

  /**
   * GET /api/v1/audit/entity/:entity/:entityId
   * Chronological lifecycle timeline for an entity.
   */
  getEntityTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = EntityTimelineParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid entity timeline parameters",
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { entity, entityId } = parsed.data;
      const timeline = await this.queryService.getEntityTimeline(entity, entityId);

      res.status(200).json({
        entity,
        entityId,
        totalEvents: timeline.length,
        timeline,
      });
    } catch (error) {
      this.handleError(error, res, { action: "getEntityTimeline", params: req.params });
    }
  };

  /**
   * GET /api/v1/audit/user/:userId
   * Activity history of a specific user.
   */
  getUserActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedParam = UserIdParamSchema.safeParse(req.params);
      if (!parsedParam.success) {
        res.status(400).json({
          error: "Invalid user ID parameter",
          details: parsedParam.error.flatten().fieldErrors,
        });
        return;
      }

      const parsedQuery = AuditQuerySchema.safeParse(req.query);
      const page = parsedQuery.success ? parsedQuery.data.page : 1;
      const limit = parsedQuery.success ? parsedQuery.data.limit : 20;

      const { userId } = parsedParam.data;
      const result = await this.queryService.getUserActivity(userId, { page, limit });

      res.status(200).json({
        userId,
        ...result,
      });
    } catch (error) {
      this.handleError(error, res, { action: "getUserActivity", params: req.params });
    }
  };

  private handleError(error: unknown, res: Response, meta: Record<string, any>): void {
    if (error instanceof AuditError) {
      log.warn(
        { ...meta, error: error.message, code: error.code, statusCode: error.statusCode },
        "Handled domain error in AuditController",
      );
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
      return;
    }

    log.error({ ...meta, error }, "Unhandled server error in AuditController");
    res.status(500).json({
      error: "Internal server error occurred while retrieving audit logs.",
    });
  }
}
