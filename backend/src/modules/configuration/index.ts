/**
 * Discount Configuration Module — Barrel Export
 *
 * Single entry point for managing discount policies and approval rules:
 *
 *   import {
 *     DiscountPolicyService,
 *     ApprovalRuleService,
 *     createConfigurationRouter
 *   } from "./modules/configuration";
 */

// ── Services ─────────────────────────────────────────────────────────────────
export { DiscountPolicyService } from "./services/DiscountPolicyService.js";
export { ApprovalRuleService } from "./services/ApprovalRuleService.js";
export { ValidationService } from "./services/ValidationService.js";

// ── Controllers & Routes ─────────────────────────────────────────────────────
export { DiscountPolicyController } from "./controllers/DiscountPolicyController.js";
export { ApprovalRuleController } from "./controllers/ApprovalRuleController.js";
export { createConfigurationRouter } from "./routes/routes.js";

// ── Middleware ───────────────────────────────────────────────────────────────
export {
  requireAuth,
  requireRole,
  requireAdmin,
  requireReadAccess,
  extractUser,
} from "./middleware/auth.js";
export type { AuthenticatedUser } from "./middleware/auth.js";

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  CustomerTier,
  RoleType,
  DiscountPolicyDomain,
  ApprovalRuleDomain,
  DiscountPolicyFilter,
  ApprovalRuleFilter,
  PaginationParams,
  PaginatedResult,
} from "./types/types.js";

// ── Interfaces ────────────────────────────────────────────────────────────────
export type {
  IDiscountPolicyService,
  IApprovalRuleService,
  IValidationService,
  CreateDiscountPolicyInput,
  UpdateDiscountPolicyInput,
  CreateApprovalRuleInput,
  UpdateApprovalRuleInput,
} from "./interfaces/interfaces.js";

// ── Errors ────────────────────────────────────────────────────────────────────
export {
  ConfigurationError,
  ValidationError,
  DuplicateEntityError,
  RangeOverlapError,
  EntityNotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "./utils/errors.js";

// ── DTOs ──────────────────────────────────────────────────────────────────────
export {
  CreateDiscountPolicySchema,
  UpdateDiscountPolicySchema,
  CreateApprovalRuleSchema,
  UpdateApprovalRuleSchema,
  DiscountPolicyQuerySchema,
  ApprovalRuleQuerySchema,
  IdParamSchema,
  CustomerTierEnum,
  ApprovalLevelEnum,
} from "./dto/dto.js";

export type {
  CreateDiscountPolicyDto,
  UpdateDiscountPolicyDto,
  CreateApprovalRuleDto,
  UpdateApprovalRuleDto,
  DiscountPolicyQueryDto,
  ApprovalRuleQueryDto,
} from "./dto/dto.js";
