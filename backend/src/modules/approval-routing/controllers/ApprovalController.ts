/**
 * ApprovalController
 *
 * Express handlers for quotation approval routing endpoints.
 *
 * Endpoints:
 *   POST /api/v1/approvals/start
 *   POST /api/v1/approvals/:approvalId/approve
 *   POST /api/v1/approvals/:approvalId/reject
 *   POST /api/v1/approvals/:approvalId/return
 *   GET  /api/v1/approvals/quotation/:quotationId
 *   GET  /api/v1/approvals/pending
 */

import type { Request, Response } from "express";
import { ApprovalRoutingService } from "../services/ApprovalRoutingService.js";
import {
  StartWorkflowSchema,
  ApproveActionSchema,
  RejectActionSchema,
  ReturnActionSchema,
  PendingApprovalsQuerySchema,
  ApprovalIdParamSchema,
  QuotationIdParamSchema,
} from "../dto/dto.js";
import { ApprovalRoutingError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-controller");

export class ApprovalController {
  constructor(private readonly service: ApprovalRoutingService) {}

  /**
   * POST /api/v1/approvals/start
   */
  startWorkflow = async (req: Request, res: Response): Promise<void> => {
    const startTime = performance.now();
    try {
      const bodyResult = StartWorkflowSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid request payload",
          details: bodyResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { quotationId } = bodyResult.data;
      const result = await this.service.startWorkflow(quotationId);

      const executionTimeMs = Math.round(performance.now() - startTime);
      log.info(
        {
          quotationId,
          action: "START_WORKFLOW",
          workflowStatus: result.workflowStatus,
          stage: result.currentStage,
          executionTimeMs,
        },
        "Workflow started successfully",
      );

      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "startWorkflow", body: req.body });
    }
  };

  /**
   * POST /api/v1/approvals/:approvalId/approve
   */
  approve = async (req: Request, res: Response): Promise<void> => {
    const startTime = performance.now();
    try {
      const paramResult = ApprovalIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid path parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const bodyResult = ApproveActionSchema.safeParse(req.body ?? {});
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid request payload",
          details: bodyResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { approvalId } = paramResult.data;
      const approverId =
        bodyResult.data.approverId ??
        (req as any).user?.id ??
        (req.headers["x-user-id"] as string);

      const result = await this.service.approve(
        approvalId,
        approverId,
        bodyResult.data.comments,
      );

      const executionTimeMs = Math.round(performance.now() - startTime);
      log.info(
        {
          approvalId,
          quotationId: result.quotationId,
          approverId,
          stage: result.currentStage,
          action: "APPROVE",
          executionTimeMs,
        },
        "Approval completed successfully",
      );

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "approve", params: req.params });
    }
  };

  /**
   * POST /api/v1/approvals/:approvalId/reject
   */
  reject = async (req: Request, res: Response): Promise<void> => {
    const startTime = performance.now();
    try {
      const paramResult = ApprovalIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid path parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const bodyResult = RejectActionSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid request payload",
          details: bodyResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { approvalId } = paramResult.data;
      const approverId =
        bodyResult.data.approverId ??
        (req as any).user?.id ??
        (req.headers["x-user-id"] as string);

      const result = await this.service.reject(
        approvalId,
        approverId,
        bodyResult.data.comments,
      );

      const executionTimeMs = Math.round(performance.now() - startTime);
      log.info(
        {
          approvalId,
          quotationId: result.quotationId,
          approverId,
          action: "REJECT",
          executionTimeMs,
        },
        "Rejection completed successfully",
      );

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "reject", params: req.params });
    }
  };

  /**
   * POST /api/v1/approvals/:approvalId/return
   */
  returnForRevision = async (req: Request, res: Response): Promise<void> => {
    const startTime = performance.now();
    try {
      const paramResult = ApprovalIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid path parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const bodyResult = ReturnActionSchema.safeParse(req.body ?? {});
      if (!bodyResult.success) {
        res.status(400).json({
          error: "Invalid request payload",
          details: bodyResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { approvalId } = paramResult.data;
      const approverId =
        bodyResult.data.approverId ??
        (req as any).user?.id ??
        (req.headers["x-user-id"] as string);

      const result = await this.service.returnForRevision(
        approvalId,
        approverId,
        bodyResult.data.comments,
      );

      const executionTimeMs = Math.round(performance.now() - startTime);
      log.info(
        {
          approvalId,
          quotationId: result.quotationId,
          approverId,
          action: "RETURN_FOR_REVISION",
          executionTimeMs,
        },
        "Return for revision completed successfully",
      );

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, { action: "returnForRevision", params: req.params });
    }
  };

  /**
   * GET /api/v1/approvals/quotation/:quotationId
   */
  getWorkflowStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const paramResult = QuotationIdParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        res.status(400).json({
          error: "Invalid path parameter",
          details: paramResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { quotationId } = paramResult.data;
      const status = await this.service.getWorkflowStatus(quotationId);

      res.status(200).json(status);
    } catch (error) {
      this.handleError(error, res, { action: "getWorkflowStatus", params: req.params });
    }
  };

  /**
   * GET /api/v1/approvals/pending
   */
  getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryResult = PendingApprovalsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: queryResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { role, userId, user, status } = queryResult.data;
      const results = await this.service.getPendingApprovals({
        role: role as any,
        userId: userId || user,
        status: status as any,
      });

      res.status(200).json(results);
    } catch (error) {
      this.handleError(error, res, { action: "getPendingApprovals", query: req.query });
    }
  };

  // ─── Error handling ────────────────────────────────────────────────────────

  private handleError(error: unknown, res: Response, context?: Record<string, unknown>): void {
    if (error instanceof ApprovalRoutingError) {
      log.warn(
        { ...context, statusCode: error.statusCode, errorName: error.name, message: error.message },
        "Approval domain error encountered",
      );
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    log.error({ ...context, error }, "Unexpected error in approval controller");
    res.status(500).json({ error: "Internal server error" });
  }
}
