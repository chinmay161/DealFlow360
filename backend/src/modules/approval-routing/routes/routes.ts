/**
 * Approval Routing — Express Routes
 *
 * Mounts approval workflow endpoints:
 *   POST /api/v1/approvals/start
 *   POST /api/v1/approvals/:approvalId/approve
 *   POST /api/v1/approvals/:approvalId/reject
 *   POST /api/v1/approvals/:approvalId/return
 *   GET  /api/v1/approvals/quotation/:quotationId
 *   GET  /api/v1/approvals/pending
 */

import { Router } from "express";
import { ApprovalController } from "../controllers/ApprovalController.js";
import { ApprovalRoutingService } from "../services/ApprovalRoutingService.js";
import { prisma } from "../../../lib/prisma.js";

/**
 * Factory creating and returning the configured Express router for approval routing.
 */
export function createApprovalRouter(customService?: ApprovalRoutingService): Router {
  const router = Router();
  const service = customService ?? new ApprovalRoutingService(prisma);
  const controller = new ApprovalController(service);

  // Workflow initialization
  router.post("/api/v1/approvals/start", controller.startWorkflow);

  // Queries (placed before parameterized :approvalId paths)
  router.get("/api/v1/approvals/pending", controller.getPendingApprovals);
  router.get("/api/v1/approvals/quotation/:quotationId", controller.getWorkflowStatus);

  // Approval actions
  router.post("/api/v1/approvals/:approvalId/approve", controller.approve);
  router.post("/api/v1/approvals/:approvalId/reject", controller.reject);
  router.post("/api/v1/approvals/:approvalId/return", controller.returnForRevision);

  return router;
}
