/**
 * ApprovalRuleController
 *
 * Express handlers for Approval Rule endpoints:
 *   GET    /api/v1/config/approval-rules
 *   GET    /api/v1/config/approval-rules/:id
 *   POST   /api/v1/config/approval-rules
 *   PATCH  /api/v1/config/approval-rules/:id
 *   DELETE /api/v1/config/approval-rules/:id
 */

import type { Request, Response } from "express";
import type { IApprovalRuleService } from "../interfaces/interfaces.js";
import {
  CreateApprovalRuleSchema,
  UpdateApprovalRuleSchema,
  ApprovalRuleQuerySchema,
  IdParamSchema,
} from "../dto/dto.js";
import { ConfigurationError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-rule-controller");

export class ApprovalRuleController {
  constructor(private readonly service: IApprovalRuleService) {}

  /**
   * GET /api/v1/config/approval-rules
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryResult = ApprovalRuleQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: queryResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { level, active, stage, page, limit } = queryResult.data;
      const result = await this.service.list(
        { level, active, stage },
        { page, limit },
      );

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "list" });
    }
  };

  /**
   * GET /api/v1/config/approval-rules/:id
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const paramResult = IdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid ID parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { id } = paramResult.data;
      const rule = await this.service.getById(id);

      res.status(200).json(rule);
    } catch (error) {
      this.handleError(error, res, { action: "getById", id: req.params.id });
    }
  };

  /**
   * POST /api/v1/config/approval-rules
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const bodyResult = CreateApprovalRuleSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid approval rule payload",
          details: bodyResult.error.flatten().fieldErrors,
        });
        return;
      }

      const actorId = req.user?.id ?? "system";
      const created = await this.service.create(bodyResult.data, actorId);

      res.status(201).json(created);
    } catch (error) {
      this.handleError(error, res, { action: "create", body: req.body });
    }
  };

  /**
   * PATCH /api/v1/config/approval-rules/:id
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const paramResult = IdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid ID parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const bodyResult = UpdateApprovalRuleSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid approval rule update payload",
          details: bodyResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { id } = paramResult.data;
      const actorId = req.user?.id ?? "system";
      const updated = await this.service.update(id, bodyResult.data, actorId);

      res.status(200).json(updated);
    } catch (error) {
      this.handleError(error, res, { action: "update", id: req.params.id, body: req.body });
    }
  };

  /**
   * DELETE /api/v1/config/approval-rules/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const paramResult = IdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid ID parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { id } = paramResult.data;
      const actorId = req.user?.id ?? "system";
      await this.service.delete(id, actorId);

      res.status(200).json({
        success: true,
        message: `Approval rule "${id}" deleted successfully.`,
      });
    } catch (error) {
      this.handleError(error, res, { action: "delete", id: req.params.id });
    }
  };

  private handleError(error: unknown, res: Response, meta: Record<string, any>): void {
    if (error instanceof ConfigurationError) {
      log.warn(
        { ...meta, error: error.message, code: error.code, statusCode: error.statusCode },
        "Handled configuration error in ApprovalRuleController",
      );
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
      return;
    }

    log.error({ ...meta, error }, "Unhandled server error in ApprovalRuleController");
    res.status(500).json({
      error: "Internal server error occurred while processing approval rule.",
    });
  }
}
