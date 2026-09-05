/**
 * Discount Configuration Module — Express Routes
 *
 * Mounts:
 *   GET    /api/v1/config/discount-policies
 *   GET    /api/v1/config/discount-policies/:id
 *   POST   /api/v1/config/discount-policies
 *   PATCH  /api/v1/config/discount-policies/:id
 *   DELETE /api/v1/config/discount-policies/:id
 *
 *   GET    /api/v1/config/approval-rules
 *   GET    /api/v1/config/approval-rules/:id
 *   POST   /api/v1/config/approval-rules
 *   PATCH  /api/v1/config/approval-rules/:id
 *   DELETE /api/v1/config/approval-rules/:id
 */

import { Router } from "express";
import { DiscountPolicyController } from "../controllers/DiscountPolicyController.js";
import { ApprovalRuleController } from "../controllers/ApprovalRuleController.js";
import { DiscountPolicyService } from "../services/DiscountPolicyService.js";
import { ApprovalRuleService } from "../services/ApprovalRuleService.js";
import { ValidationService } from "../services/ValidationService.js";
import { requireAdmin, requireReadAccess } from "../middleware/auth.js";
import { prisma } from "../../../lib/prisma.js";

export function createConfigurationRouter(options?: {
  discountPolicyService?: DiscountPolicyService;
  approvalRuleService?: ApprovalRuleService;
  validationService?: ValidationService;
}): Router {
  const router = Router();

  const validationService =
    options?.validationService ?? new ValidationService(prisma);
  const discountPolicyService =
    options?.discountPolicyService ??
    new DiscountPolicyService(prisma, validationService);
  const approvalRuleService =
    options?.approvalRuleService ??
    new ApprovalRuleService(prisma, validationService);

  const policyController = new DiscountPolicyController(discountPolicyService);
  const ruleController = new ApprovalRuleController(approvalRuleService);

  // ── Discount Policies Endpoints ───────────────────────────────────────────
  router.get(
    "/api/v1/config/discount-policies",
    requireReadAccess,
    policyController.list,
  );
  router.get(
    "/api/v1/config/discount-policies/:id",
    requireReadAccess,
    policyController.getById,
  );
  router.post(
    "/api/v1/config/discount-policies",
    requireAdmin,
    policyController.create,
  );
  router.patch(
    "/api/v1/config/discount-policies/:id",
    requireAdmin,
    policyController.update,
  );
  router.delete(
    "/api/v1/config/discount-policies/:id",
    requireAdmin,
    policyController.delete,
  );

  // ── Approval Rules Endpoints ──────────────────────────────────────────────
  router.get(
    "/api/v1/config/approval-rules",
    requireReadAccess,
    ruleController.list,
  );
  router.get(
    "/api/v1/config/approval-rules/:id",
    requireReadAccess,
    ruleController.getById,
  );
  router.post(
    "/api/v1/config/approval-rules",
    requireAdmin,
    ruleController.create,
  );
  router.patch(
    "/api/v1/config/approval-rules/:id",
    requireAdmin,
    ruleController.update,
  );
  router.delete(
    "/api/v1/config/approval-rules/:id",
    requireAdmin,
    ruleController.delete,
  );

  return router;
}
