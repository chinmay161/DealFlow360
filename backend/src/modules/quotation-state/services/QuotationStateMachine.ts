/**
 * QuotationStateMachine
 *
 * Centralized State Machine for DealFlow360 quotation lifecycle.
 * All status changes across the system must flow through this orchestrator.
 *
 * Usage:
 *   await quotationStateMachine.transition(quotationId, targetState, actorId, reason?);
 */

import type { PrismaClient } from "@prisma/client";
import type {
  IQuotationStateMachine,
  ITransitionValidator,
  ITransitionExecutor,
  IWorkflowService,
} from "../interfaces/interfaces.js";
import {
  QuotationState,
  TransitionContext,
  TransitionResult,
  normalizeState,
} from "../types/types.js";
import {
  QuotationNotFoundError,
  InvalidStateError,
} from "../utils/errors.js";
import { TransitionValidator } from "./TransitionValidator.js";
import { TransitionExecutor } from "./TransitionExecutor.js";
import { WorkflowService } from "./WorkflowService.js";
import { StateHistoryService } from "./StateHistoryService.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("quotation-state-machine");

export interface QuotationStateMachineOptions {
  validator?: ITransitionValidator;
  executor?: ITransitionExecutor;
  workflowService?: IWorkflowService;
  historyService?: StateHistoryService;
}

export class QuotationStateMachine implements IQuotationStateMachine {
  private readonly validator: ITransitionValidator;
  private readonly executor: ITransitionExecutor;
  private readonly workflowService: IWorkflowService;

  constructor(
    private readonly prisma: PrismaClient,
    options?: QuotationStateMachineOptions,
  ) {
    const historyService = options?.historyService ?? new StateHistoryService(prisma);
    this.validator = options?.validator ?? new TransitionValidator(prisma);
    this.executor = options?.executor ?? new TransitionExecutor(prisma, historyService);
    this.workflowService = options?.workflowService ?? new WorkflowService(prisma);
  }

  /**
   * Transition a quotation from its current state to a target state.
   *
   * @param quotationId Target quotation ID
   * @param targetState Target state name or enum
   * @param actorId     Actor performing the transition
   * @param reason      Optional justification
   */
  async transition(
    quotationId: string,
    targetState: QuotationState | string,
    actorId: string,
    reason?: string,
  ): Promise<TransitionResult> {
    const startTime = performance.now();

    // 1. Normalize and validate target state
    const normalizedTarget =
      typeof targetState === "string"
        ? normalizeState(targetState)
        : targetState;

    if (!normalizedTarget) {
      log.warn({ quotationId, targetState }, "Invalid target state supplied");
      throw new InvalidStateError(String(targetState));
    }

    // 2. Fetch quotation to discover current state
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      log.warn({ quotationId }, "Quotation not found for transition");
      throw new QuotationNotFoundError(quotationId);
    }

    const currentNormalized = normalizeState(quotation.status) ?? QuotationState.Draft;

    // 3. Construct transition context
    const context: TransitionContext = {
      quotationId,
      currentState: currentNormalized,
      targetState: normalizedTarget,
      actorId,
      reason,
      timestamp: new Date(),
    };

    // 4. Validate transition via TransitionValidator
    await this.validator.validate(context);

    // 5. Execute DB transition and history persistence
    let result = await this.executor.execute(context);

    // 6. Handle workflow integrations (Rule Engine, Approval Routing, Downstream)
    const workflowEffect = await this.workflowService.onTransition(context);

    // 7. If workflow dictates auto-advance (e.g., Submitted -> PendingManager or Approved or Rejected)
    if (workflowEffect.autoAdvance && workflowEffect.nextState && workflowEffect.nextState !== normalizedTarget) {
      log.info(
        {
          quotationId,
          fromState: normalizedTarget,
          nextState: workflowEffect.nextState,
        },
        "Workflow triggered automatic state progression",
      );

      const autoContext: TransitionContext = {
        quotationId,
        currentState: normalizedTarget,
        targetState: workflowEffect.nextState,
        actorId,
        actor: context.actor,
        reason: `Auto-transitioned by workflow: ${workflowEffect.workflowDetails?.ruleResult?.decision ?? "Workflow progressed"}`,
        timestamp: new Date(),
      };

      // Validate and execute secondary step
      await this.validator.validate(autoContext);
      result = await this.executor.execute(autoContext, workflowEffect.workflowDetails);
    }

    const executionTime = Math.round(performance.now() - startTime);

    // 8. Mandatory structured Pino logging
    log.info(
      {
        quotationId,
        previousState: currentNormalized,
        nextState: result.currentState,
        actor: actorId,
        executionTime,
      },
      "Quotation state transition completed successfully",
    );

    return {
      ...result,
      executionTimeMs: executionTime,
    };
  }
}
