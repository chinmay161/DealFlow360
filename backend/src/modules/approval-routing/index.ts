/**
 * Approval Routing Module — Barrel Export
 *
 * Single entry point for consumers:
 *
 *   import {
 *     ApprovalRoutingService,
 *     createApprovalRouter,
 *   } from "./modules/approval-routing";
 */

// ── Services ─────────────────────────────────────────────────────────────────
export { ApprovalRoutingService } from "./services/ApprovalRoutingService.js";
export type { ApprovalRoutingServiceOptions } from "./services/ApprovalRoutingService.js";

export {
  ApprovalWorkflowService,
  WORKFLOW_CHAIN_DEFINITIONS,
} from "./services/ApprovalWorkflowService.js";

export {
  ApprovalAssignmentService,
  FirstActiveApproverStrategy,
} from "./services/ApprovalAssignmentService.js";
export type {
  ApproverAssignmentStrategy,
  AssignmentContext,
} from "./services/ApprovalAssignmentService.js";

export { ApprovalActionService } from "./services/ApprovalActionService.js";
export { ApprovalHistoryService } from "./services/ApprovalHistoryService.js";

// ── Notifications ────────────────────────────────────────────────────────────
export {
  MockNotificationProvider,
} from "./interfaces/NotificationProvider.js";
export type {
  NotificationProvider,
  ApprovalAssignedParams,
  ApprovalCompletedParams,
  ApprovalRejectedParams,
} from "./interfaces/NotificationProvider.js";

// ── Controller & Router ──────────────────────────────────────────────────────
export { ApprovalController } from "./controllers/ApprovalController.js";
export { createApprovalRouter } from "./routes/routes.js";

// ── Errors ───────────────────────────────────────────────────────────────────
export {
  ApprovalRoutingError,
  QuotationNotFoundError,
  ApprovalNotFoundError,
  ApproverNotFoundError,
  ApprovalAlreadyCompletedError,
  DuplicateApprovalError,
  UnauthorizedApproverError,
  InvalidWorkflowTransitionError,
  SkippedStageError,
} from "./utils/errors.js";

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  WorkflowStatus,
  ApprovalLevelType,
  StageDefinition,
  ApproverUserInfo,
  ApprovalRecordDto,
  WorkflowResult,
  ApprovalHistoryEntry,
  WorkflowStatusResponse,
  PendingApprovalsFilter,
  ApprovalStatus,
  ApprovalAction,
  QuotationStatus,
  RoleType,
  AuditAction,
} from "./types/types.js";

// ── DTOs ─────────────────────────────────────────────────────────────────────
export {
  StartWorkflowSchema,
  ApproveActionSchema,
  RejectActionSchema,
  ReturnActionSchema,
  DelegateActionSchema,
  PendingApprovalsQuerySchema,
  ApprovalIdParamSchema,
  QuotationIdParamSchema,
} from "./dto/dto.js";

export type {
  StartWorkflowDto,
  ApproveActionDto,
  RejectActionDto,
  ReturnActionDto,
  DelegateActionDto,
  PendingApprovalsQueryDto,
  ApprovalIdParam,
  QuotationIdParam,
} from "./dto/dto.js";
