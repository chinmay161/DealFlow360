/**
 * TransitionValidator
 *
 * Enforces quotation lifecycle transition rules:
 * - Quotation existence (404)
 * - Valid state transitions in the transition graph (409)
 * - Terminal state lock (409)
 * - Actor permissions and role suitability (403)
 * - Approval completion before moving to Approved (409)
 */

import type { PrismaClient } from "@prisma/client";
import type { ITransitionValidator } from "../interfaces/interfaces.js";
import {
  QuotationState,
  STATE_TRANSITIONS_CONFIG,
  TransitionContext,
  normalizeState,
} from "../types/types.js";
import {
  QuotationNotFoundError,
  ActorNotFoundError,
  InvalidTransitionError,
  UnauthorizedTransitionError,
  ApprovalIncompleteError,
} from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("transition-validator");

export class TransitionValidator implements ITransitionValidator {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Check if a transition between two states is permitted by the transition graph.
   */
  isAllowedTransition(from: QuotationState, to: QuotationState): boolean {
    const config = STATE_TRANSITIONS_CONFIG[from];
    if (!config) return false;
    return config.allowedTargets.includes(to);
  }

  /**
   * Get list of allowed next states for a given state.
   */
  getAllowedNextStates(currentState: QuotationState): QuotationState[] {
    return STATE_TRANSITIONS_CONFIG[currentState]?.allowedTargets ?? [];
  }

  /**
   * Validate entire transition context against database and business rules.
   */
  async validate(context: TransitionContext): Promise<void> {
    const { quotationId, currentState, targetState, actorId } = context;

    // 1. Validate quotation existence
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        approvals: true,
      },
    });

    if (!quotation) {
      log.warn({ quotationId }, "Quotation not found during transition validation");
      throw new QuotationNotFoundError(quotationId);
    }

    // 2. Validate current state vs quotation actual DB status
    const actualCurrentState = normalizeState(quotation.status) ?? currentState;
    const config = STATE_TRANSITIONS_CONFIG[actualCurrentState];

    if (!config) {
      log.warn({ quotationId, actualCurrentState }, "Unknown current state on quotation");
      throw new InvalidTransitionError(actualCurrentState, targetState, "Unknown current state");
    }

    // 3. Verify terminal state locking
    if (config.isTerminal) {
      log.warn(
        { quotationId, actualCurrentState, targetState },
        "Attempted transition from terminal state",
      );
      throw new InvalidTransitionError(
        actualCurrentState,
        targetState,
        `State "${actualCurrentState}" is terminal and cannot be transitioned from.`,
      );
    }

    // 4. Verify transition graph compatibility
    if (!this.isAllowedTransition(actualCurrentState, targetState)) {
      log.warn(
        { quotationId, from: actualCurrentState, to: targetState },
        "Illegal transition attempted",
      );
      throw new InvalidTransitionError(
        actualCurrentState,
        targetState,
        `Transition from "${actualCurrentState}" to "${targetState}" is not permitted.`,
      );
    }

    // 5. Validate actor permissions (if actor provided and not system)
    if (actorId && actorId !== "system") {
      const actorUser = await this.prisma.user.findUnique({
        where: { id: actorId },
        include: { role: true },
      });

      if (!actorUser) {
        log.warn({ quotationId, actorId }, "Actor user record not found");
        throw new ActorNotFoundError(actorId);
      }

      // Populate actor on context for downstream use
      context.actor = {
        id: actorUser.id,
        email: actorUser.email,
        firstName: actorUser.firstName,
        lastName: actorUser.lastName,
        role: actorUser.role?.name ?? (actorUser as any).roleId,
      };

      const roleName = actorUser.role?.name ?? (actorUser as any).roleId;

      // Role permission checks based on transition
      this.validateRolePermissions(actualCurrentState, targetState, roleName, actorId);
    }

    // 6. Validate approval completion when transitioning to Approved
    if (targetState === QuotationState.Approved) {
      await this.validateApprovalCompletion(quotation);
    }
  }

  /**
   * Verify actor's role is authorized for the transition.
   */
  private validateRolePermissions(
    from: QuotationState,
    to: QuotationState,
    role: string,
    actorId: string,
  ): void {
    // Admin can perform all transitions
    if (role === "ADMIN") return;

    // Moving from Draft to Submitted: SALES_REP or MANAGER
    if (from === QuotationState.Draft && to === QuotationState.Submitted) {
      if (!["SALES_REP", "MANAGER"].includes(role)) {
        throw new UnauthorizedTransitionError(actorId, role, from, to);
      }
    }

    // Actions from PendingManager: MANAGER
    if (from === QuotationState.PendingManager) {
      if (!["MANAGER"].includes(role)) {
        throw new UnauthorizedTransitionError(actorId, role, from, to);
      }
    }

    // Actions from PendingFinance: FINANCE
    if (from === QuotationState.PendingFinance) {
      if (!["FINANCE"].includes(role)) {
        throw new UnauthorizedTransitionError(actorId, role, from, to);
      }
    }

    // Actions on Fulfilled / Closed: ADMIN or MANAGER
    if (to === QuotationState.Closed && !["ADMIN"].includes(role)) {
      throw new UnauthorizedTransitionError(actorId, role, from, to);
    }
  }

  /**
   * Verify all approval stages are completed before allowing transition to Approved.
   */
  private async validateApprovalCompletion(quotation: any): Promise<void> {
    const approvals = quotation.approvals ?? [];

    if (approvals.length > 0) {
      // If approval records exist, ensure none are PENDING or REJECTED
      const pendingApproval = approvals.find((a: any) => a.status === "PENDING");
      if (pendingApproval) {
        log.warn(
          { quotationId: quotation.id, stage: pendingApproval.stage },
          "Approval incomplete: pending stage found",
        );
        throw new ApprovalIncompleteError(
          quotation.id,
          pendingApproval.stage,
          `Stage ${pendingApproval.stage} approval is still pending.`,
        );
      }

      const rejectedApproval = approvals.find((a: any) => a.status === "REJECTED");
      if (rejectedApproval) {
        log.warn(
          { quotationId: quotation.id, stage: rejectedApproval.stage },
          "Approval rejected: cannot transition to Approved",
        );
        throw new ApprovalIncompleteError(
          quotation.id,
          rejectedApproval.stage,
          `Quotation has a rejected approval at stage ${rejectedApproval.stage}.`,
        );
      }
    }
  }
}
