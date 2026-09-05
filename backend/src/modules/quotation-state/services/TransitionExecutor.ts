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
import type { TransitionContext, TransitionResult } from "../types/types.js";
import { StateHistoryService } from "./StateHistoryService.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("transition-executor");

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
      // 1. Update quotation status
      const updatedQuotation = await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: targetState as any,
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
