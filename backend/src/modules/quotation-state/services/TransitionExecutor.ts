/**
 * TransitionExecutor
 *
 * Atomically commits quotation state transitions:
 * 1. Updates Quotation entity status in database
 * 2. Records immutable StateHistoryEntry / AuditLog
 * 3. Builds and returns the comprehensive TransitionResult
 */

import type { PrismaClient } from "@prisma/client";
import type { ITransitionExecutor, IStateHistoryService } from "../interfaces/interfaces.js";
import {
  QuotationState,
  type TransitionContext,
  type TransitionResult,
} from "../types/types.js";
import { StateHistoryService } from "./StateHistoryService.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("transition-executor");

function mapQuotationStateToDbStatus(state: QuotationState | string): string {
  switch (state) {
    case QuotationState.Draft:
      return "DRAFT";
    case QuotationState.Submitted:
    case QuotationState.PendingManager:
    case QuotationState.PendingFinance:
      return "PENDING_APPROVAL";
    case QuotationState.Approved:
      return "APPROVED";
    case QuotationState.Rejected:
      return "REJECTED";
    case QuotationState.ReturnedForRevision:
      return "IN_REVIEW";
    case QuotationState.Reserved:
      return "APPROVED";
    case QuotationState.Fulfilled:
    case QuotationState.Closed:
      return "ACCEPTED";
    case QuotationState.Cancelled:
      return "CANCELLED";
    default:
      return "DRAFT";
  }
}

export class TransitionExecutor implements ITransitionExecutor {
  private readonly historyService: IStateHistoryService;

  constructor(
    private readonly prisma: PrismaClient,
    historyService?: IStateHistoryService,
  ) {
    this.historyService = historyService ?? new StateHistoryService(prisma);
  }

  /**
   * Execute atomic DB update and history persistence.
   */
  async execute(
    context: TransitionContext,
    workflowDetails?: Record<string, any>,
  ): Promise<TransitionResult> {
    const startTime = performance.now();
    const { quotationId, currentState, targetState, actorId, reason, timestamp } = context;

    log.info(
      {
        quotationId,
        fromState: currentState,
        toState: targetState,
        actorId,
      },
      "Executing state transition",
    );

    return this.prisma.$transaction(async (tx) => {
      // 1. Update quotation status & currentStage
      const dbStatus = mapQuotationStateToDbStatus(targetState);
      const updatedQuotation = await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: dbStatus as any,
          currentStage: targetState,
          updatedAt: timestamp,
        },
      });

      // 2. Record immutable state history entry
      const historyEntry = await (this.historyService as StateHistoryService).recordTransition(
        {
          quotationId,
          previousState: currentState,
          nextState: targetState,
          actorId,
          actor: context.actor,
          reason,
          timestamp,
          metadata: workflowDetails,
        },
        tx,
      );

      const executionTimeMs = Math.round(performance.now() - startTime);

      log.info(
        {
          quotationId,
          fromState: currentState,
          toState: targetState,
          actorId,
          executionTimeMs,
        },
        "State transition successfully executed and recorded",
      );

      return {
        success: true,
        quotationId,
        previousState: currentState,
        currentState: targetState,
        actorId,
        actor: context.actor,
        timestamp,
        reason,
        message: `Quotation successfully transitioned from "${currentState}" to "${targetState}".`,
        executionTimeMs,
        workflowDetails,
      };
    });
  }
}
