/**
 * WorkflowService
 *
 * Coordinates cross-module workflow integrations on state transitions:
 * - On Submitted:
 *     1. Evaluates Rule Engine
 *     2. Initiates Approval Routing
 *     3. Persists Decision Trace
 *     4. Resolves next lifecycle state (PendingManager, Approved, Rejected)
 * - On Approved:
 *     1. Notifies downstream modules
 *     2. Signals inventory reservation readiness
 */

import type { PrismaClient } from "@prisma/client";
import { RuleEngine } from "../../rule-engine/index.js";
import { ApprovalRoutingService } from "../../approval-routing/index.js";
import type {
  IWorkflowService,
  IDownstreamNotifier,
  WorkflowTransitionEffect,
} from "../interfaces/interfaces.js";
import { QuotationState, TransitionContext } from "../types/types.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("quotation-workflow-service");

/**
 * Default mock downstream notifier implementation.
 */
export class DefaultDownstreamNotifier implements IDownstreamNotifier {
  async notifyStateChanged(context: TransitionContext): Promise<void> {
    log.info(
      {
        quotationId: context.quotationId,
        fromState: context.currentState,
        toState: context.targetState,
      },
      "Downstream modules notified of quotation state change",
    );
  }

  async notifyReservationReady(quotationId: string): Promise<void> {
    log.info(
      { quotationId },
      "Quotation is APPROVED — downstream reservation flow can begin",
    );
  }
}

export class WorkflowService implements IWorkflowService {
  private readonly ruleEngine: RuleEngine;
  private readonly approvalRoutingService: ApprovalRoutingService;
  private readonly notifier: IDownstreamNotifier;

  constructor(
    private readonly prisma: PrismaClient,
    options?: {
      ruleEngine?: RuleEngine;
      approvalRoutingService?: ApprovalRoutingService;
      notifier?: IDownstreamNotifier;
    },
  ) {
    this.ruleEngine = options?.ruleEngine ?? new RuleEngine(prisma);
    this.approvalRoutingService =
      options?.approvalRoutingService ?? new ApprovalRoutingService(prisma);
    this.notifier = options?.notifier ?? new DefaultDownstreamNotifier();
  }

  /**
   * Handle integrations triggered by transitioning to a target state.
   */
  async onTransition(context: TransitionContext): Promise<WorkflowTransitionEffect> {
    const { targetState, quotationId } = context;

    // ── When transitioning to Submitted: Execute Rule Engine & Approval Workflow ──
    if (targetState === QuotationState.Submitted) {
      return this.handleSubmittedTransition(quotationId);
    }

    // ── When transitioning to Approved: Trigger Downstream Readiness ──
    if (targetState === QuotationState.Approved) {
      await this.onApproved(context);
      return { workflowDetails: { reservationReady: true } };
    }

    return {};
  }

  /**
   * Pipeline on Submitted:
   * 1. Invoke Rule Engine & persist decision trace
   * 2. Invoke Approval Routing
   * 3. Advance to corresponding next state
   */
  private async handleSubmittedTransition(
    quotationId: string,
  ): Promise<WorkflowTransitionEffect> {
    log.info({ quotationId }, "Executing Submitted integration pipeline");

    // 1. Invoke Rule Engine & persist trace
    const ruleResult = await this.ruleEngine.evaluate(quotationId, {
      persistTrace: true,
    });

    log.info(
      {
        quotationId,
        approved: ruleResult.approved,
        approvalLevel: ruleResult.approvalLevel,
        riskScore: ruleResult.overallRiskScore,
      },
      "Rule engine evaluation complete for submitted quotation",
    );

    // 2. Invoke Approval Routing
    const workflowResult = await this.approvalRoutingService.startWorkflow(
      quotationId,
      {
        ruleEngineResult: ruleResult,
      },
    );

    log.info(
      {
        quotationId,
        workflowStatus: workflowResult.workflowStatus,
        stage: workflowResult.currentStage,
      },
      "Approval routing workflow initiated",
    );

    // 3. Determine next state based on workflow output
    let nextState: QuotationState = QuotationState.PendingManager;

    if (workflowResult.workflowStatus === "APPROVED") {
      nextState = QuotationState.Approved;
    } else if (workflowResult.workflowStatus === "REJECTED") {
      nextState = QuotationState.Rejected;
    } else if (workflowResult.workflowStatus === "PENDING_APPROVAL") {
      if (workflowResult.currentStage === 2) {
        nextState = QuotationState.PendingFinance;
      } else {
        nextState = QuotationState.PendingManager;
      }
    }

    return {
      nextState,
      autoAdvance: true,
      workflowDetails: {
        ruleResult,
        workflowResult,
        decisionTracePersisted: true,
      },
    };
  }

  /**
   * Action when quotation becomes Approved: notify logistics/reservations.
   */
  async onApproved(context: TransitionContext): Promise<void> {
    await this.notifier.notifyStateChanged(context);
    await this.notifier.notifyReservationReady(context.quotationId);
  }
}
