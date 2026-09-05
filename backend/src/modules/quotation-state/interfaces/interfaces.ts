/**
 * Quotation State Machine — Service Interfaces
 */

import type {
  QuotationState,
  TransitionContext,
  TransitionResult,
  StateHistoryEntry,
} from "../types/types.js";

export interface IQuotationStateMachine {
  transition(
    quotationId: string,
    targetState: QuotationState | string,
    actorId: string,
    reason?: string,
  ): Promise<TransitionResult>;
}

export interface ITransitionValidator {
  validate(context: TransitionContext): Promise<void>;
  isAllowedTransition(from: QuotationState, to: QuotationState): boolean;
  getAllowedNextStates(currentState: QuotationState): QuotationState[];
}

export interface ITransitionExecutor {
  execute(
    context: TransitionContext,
    workflowDetails?: Record<string, any>,
  ): Promise<TransitionResult>;
}

export interface WorkflowTransitionEffect {
  nextState?: QuotationState;
  workflowDetails?: Record<string, any>;
  autoAdvance?: boolean;
}

export interface IWorkflowService {
  onTransition(context: TransitionContext): Promise<WorkflowTransitionEffect>;
  onApproved(context: TransitionContext): Promise<void>;
}

export interface IStateHistoryService {
  recordTransition(
    entry: Omit<StateHistoryEntry, "id">,
  ): Promise<StateHistoryEntry>;
  getHistory(quotationId: string): Promise<StateHistoryEntry[]>;
}

export interface IDownstreamNotifier {
  notifyStateChanged(context: TransitionContext): Promise<void>;
  notifyReservationReady(quotationId: string): Promise<void>;
}
