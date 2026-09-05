/**
 * Quotation State Machine Module — Barrel Export
 *
 * Single entry point for quotation state lifecycle orchestration:
 *
 *   import { QuotationStateMachine, createQuotationStateRouter } from "./modules/quotation-state";
 *   const stateMachine = new QuotationStateMachine(prisma);
 *   await stateMachine.transition(quotationId, targetState, actorId);
 */

// ── Core Services ─────────────────────────────────────────────────────────────
export { QuotationStateMachine } from "./services/QuotationStateMachine.js";
export type { QuotationStateMachineOptions } from "./services/QuotationStateMachine.js";

export { TransitionValidator } from "./services/TransitionValidator.js";
export { TransitionExecutor } from "./services/TransitionExecutor.js";
export { WorkflowService, DefaultDownstreamNotifier } from "./services/WorkflowService.js";
export { StateHistoryService } from "./services/StateHistoryService.js";

// ── Controller & Routes ───────────────────────────────────────────────────────
export { QuotationStateController } from "./controllers/QuotationStateController.js";
export { createQuotationStateRouter } from "./routes/routes.js";

// ── Types & Configuration ─────────────────────────────────────────────────────
export {
  QuotationState,
  normalizeState,
  STATE_TRANSITIONS_CONFIG,
} from "./types/types.js";
export type {
  ActorInfo,
  TransitionContext,
  TransitionResult,
  StateHistoryEntry,
  StateTransitionConfig,
} from "./types/types.js";

// ── Interfaces ────────────────────────────────────────────────────────────────
export type {
  IQuotationStateMachine,
  ITransitionValidator,
  ITransitionExecutor,
  IWorkflowService,
  IStateHistoryService,
  IDownstreamNotifier,
  WorkflowTransitionEffect,
} from "./interfaces/interfaces.js";

// ── Errors ────────────────────────────────────────────────────────────────────
export {
  QuotationStateError,
  InvalidTransitionError,
  QuotationNotFoundError,
  ActorNotFoundError,
  UnauthorizedTransitionError,
  ApprovalIncompleteError,
  InvalidStateError,
} from "./utils/errors.js";

// ── DTOs ──────────────────────────────────────────────────────────────────────
export {
  TransitionRequestSchema,
  QuotationIdParamSchema,
} from "./dto/dto.js";
export type {
  TransitionRequestDto,
  QuotationIdParamDto,
} from "./dto/dto.js";
