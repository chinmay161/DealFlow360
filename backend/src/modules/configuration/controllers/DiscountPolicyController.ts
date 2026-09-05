/**
 * DiscountPolicyController
 *
 * Express handlers for Discount Policy endpoints:
 *   GET    /api/v1/config/discount-policies
 *   GET    /api/v1/config/discount-policies/:id
 *   POST   /api/v1/config/discount-policies
 *   PATCH  /api/v1/config/discount-policies/:id
 *   DELETE /api/v1/config/discount-policies/:id
 */

import type { Request, Response } from "express";
import type { IDiscountPolicyService } from "../interfaces/interfaces.js";
import {
  CreateDiscountPolicySchema,
  UpdateDiscountPolicySchema,
  DiscountPolicyQuerySchema,
  IdParamSchema,
} from "../dto/dto.js";
import { ConfigurationError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("discount-policy-controller");

export class DiscountPolicyController {
  constructor(private readonly service: IDiscountPolicyService) {}

  /**
   * GET /api/v1/config/discount-policies
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryResult = DiscountPolicyQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: queryResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { customerTier, category, active, page, limit } = queryResult.data;
      const result = await this.service.list(
        { customerTier, category, active },
        { page, limit },
      );

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "list" });
    }
  };

  /**
   * GET /api/v1/config/discount-policies/:id
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
      const policy = await this.service.getById(id);

      res.status(200).json(policy);
    } catch (error) {
      this.handleError(error, res, { action: "getById", id: req.params.id });
    }
  };

  /**
   * POST /api/v1/config/discount-policies
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const bodyResult = CreateDiscountPolicySchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid discount policy payload",
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
   * PATCH /api/v1/config/discount-policies/:id
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

      const bodyResult = UpdateDiscountPolicySchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid discount policy update payload",
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
   * DELETE /api/v1/config/discount-policies/:id
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
        message: `Discount policy "${id}" deleted successfully.`,
      });
    } catch (error) {
      this.handleError(error, res, { action: "delete", id: req.params.id });
    }
  };

  private handleError(error: unknown, res: Response, meta: Record<string, any>): void {
    if (error instanceof ConfigurationError) {
      log.warn(
        { ...meta, error: error.message, code: error.code, statusCode: error.statusCode },
        "Handled configuration error in DiscountPolicyController",
      );
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
      return;
    }

    log.error({ ...meta, error }, "Unhandled server error in DiscountPolicyController");
    res.status(500).json({
      error: "Internal server error occurred while processing discount policy.",
    });
  }
}
