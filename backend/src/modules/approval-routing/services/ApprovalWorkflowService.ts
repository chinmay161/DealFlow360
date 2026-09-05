/**
 * ApprovalWorkflowService
 *
 * Encapsulates workflow chain definitions and all workflow validation rules:
 * - Prevents approving completed requests (409)
 * - Prevents rejecting approved requests (422)
 * - Prevents approving another user's assignment (403)
 * - Prevents duplicate approvals (409)
 * - Prevents skipped stages (422)
 * - Enforces correct state transitions
 */

import type {
  Quotation,
  Approval,
  RoleType,
  QuotationStatus,
  ApprovalStatus,
} from "@prisma/client";
import type { StageDefinition, ApprovalLevelType } from "../types/types.js";
import {
  ApprovalAlreadyCompletedError,
  DuplicateApprovalError,
  UnauthorizedApproverError,
  InvalidWorkflowTransitionError,
  SkippedStageError,
} from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-workflow-service");

/**
 * Standard stage configurations for each required approval level.
 */
export const WORKFLOW_CHAIN_DEFINITIONS: Record<string, StageDefinition[]> = {
  AUTO: [],
  AUTO_APPROVE: [],
  MANAGER: [
    {
      stage: 1,
      role: "MANAGER" as RoleType,
      name: "Manager Approval",
      description: "Direct line manager authorization",
    },
  ],
  FINANCE: [
    {
      stage: 1,
      role: "MANAGER" as RoleType,
      name: "Manager Approval",
      description: "Direct line manager authorization",
    },
    {
      stage: 2,
      role: "FINANCE" as RoleType,
      name: "Finance Approval",
      description: "Financial, margin, and payment terms review",
    },
  ],
  EXECUTIVE: [
    {
      stage: 1,
      role: "MANAGER" as RoleType,
      name: "Manager Approval",
      description: "Direct line manager authorization",
    },
    {
      stage: 2,
      role: "FINANCE" as RoleType,
      name: "Finance Approval",
      description: "Financial, margin, and payment terms review",
    },
    {
      stage: 3,
      role: "ADMIN" as RoleType,
      name: "Executive Approval",
      description: "Executive and governance sign-off",
    },
  ],
  REJECT: [],
};

export class ApprovalWorkflowService {
  /**
   * Normalize an approval level string (e.g. handles "AUTO" vs "AUTO_APPROVE").
   */
  normalizeLevel(level: string | ApprovalLevelType): string {
    const upper = (level || "AUTO").toUpperCase();
    if (upper === "AUTO" || upper === "AUTO_APPROVE") {
      return "AUTO_APPROVE";
    }
    return upper;
  }

  /**
   * Get all stage definitions for an approval level.
   */
  getChainDefinitions(level: string | ApprovalLevelType): StageDefinition[] {
    const normalized = this.normalizeLevel(level);
    return WORKFLOW_CHAIN_DEFINITIONS[normalized] ?? WORKFLOW_CHAIN_DEFINITIONS.MANAGER;
  }

  /**
   * Return total stages count for a level.
   */
  getTotalStages(level: string | ApprovalLevelType): number {
    return this.getChainDefinitions(level).length;
  }

  /**
   * Get definition for a specific stage index (1-indexed).
   */
  getStageDefinition(level: string | ApprovalLevelType, stage: number): StageDefinition | null {
    const chain = this.getChainDefinitions(level);
    return chain.find((s) => s.stage === stage) ?? null;
  }

  /**
   * Check if the given stage is the final stage in the approval chain.
   */
  isFinalStage(level: string | ApprovalLevelType, stage: number): boolean {
    const total = this.getTotalStages(level);
    return total === 0 || stage >= total;
  }

  /**
   * Get the next stage definition in sequence.
   */
  getNextStageDefinition(
    level: string | ApprovalLevelType,
    currentStage: number,
  ): StageDefinition | null {
    const nextStageIndex = currentStage + 1;
    return this.getStageDefinition(level, nextStageIndex);
  }

  /**
   * Validate that a quotation can start an approval workflow.
   */
  validateQuotationForStart(quotation: { status: QuotationStatus | string; [key: string]: any }): void {
    if (quotation.status === "APPROVED") {
      throw new InvalidWorkflowTransitionError(
        quotation.status,
        "startWorkflow",
        "Quotation is already approved",
      );
    }
    if (quotation.status === "REJECTED") {
      throw new InvalidWorkflowTransitionError(
        quotation.status,
        "startWorkflow",
        "Quotation was previously rejected. Please create a new revision or reset to Draft.",
      );
    }
  }

  /**
   * Validate an approval action (APPROVE, REJECT, REQUEST_CHANGES, DELEGATE).
   * Ensures:
   * 1. Request is in PENDING status (prevents approving/rejecting completed requests)
   * 2. Quotation is not already approved
   * 3. Approver is authorized (approverId matches assignment)
   * 4. Sequential stage ordering is honored (no skipped stages)
   * 5. No duplicate approval exists for this stage
   */
  validateApprovalAction(params: {
    approval: { id: string; stage: number; status: ApprovalStatus | string; approverId: string; quotationId?: string; [key: string]: any };
    approverId?: string;
    action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "DELEGATE";
    quotation: { id: string; status: QuotationStatus | string; [key: string]: any };
    existingApprovals: Array<{ id: string; stage: number; status: ApprovalStatus | string; [key: string]: any }>;
  }): void {
    const { approval, approverId, action, quotation, existingApprovals } = params;

    // 1. Prevent action on completed requests
    if (approval.status !== "PENDING") {
      log.warn(
        { approvalId: approval.id, status: approval.status, action },
        "Attempted action on completed approval",
      );
      throw new ApprovalAlreadyCompletedError(approval.id, approval.status);
    }

    // 2. Prevent action on already approved quotations
    if (quotation.status === "APPROVED") {
      log.warn(
        { quotationId: quotation.id, status: quotation.status, action },
        "Attempted action on already approved quotation",
      );
      throw new InvalidWorkflowTransitionError(
        quotation.status,
        action,
        "Quotation is already approved",
      );
    }

    // 3. Prevent unauthorized approvers
    if (approverId && approverId !== approval.approverId) {
      log.warn(
        { approvalId: approval.id, approverId, assignedTo: approval.approverId },
        "Unauthorized approver attempted action",
      );
      throw new UnauthorizedApproverError(approverId, approval.approverId);
    }

    // 4. Prevent skipped stages (for APPROVE actions)
    if (action === "APPROVE" && approval.stage > 1) {
      const priorStages = existingApprovals.filter((a) => a.stage < approval.stage);
      for (let s = 1; s < approval.stage; s++) {
        const stageRecord = priorStages.find((a) => a.stage === s);
        if (!stageRecord || stageRecord.status !== "APPROVED") {
          log.warn(
            { quotationId: quotation.id, currentStage: approval.stage, missingPriorStage: s },
            "Attempted to approve stage before prior stage was approved",
          );
          throw new SkippedStageError(s, approval.stage);
        }
      }
    }

    // 5. Prevent duplicate approvals for same stage
    if (action === "APPROVE") {
      const alreadyApproved = existingApprovals.some(
        (a) => a.id !== approval.id && a.stage === approval.stage && a.status === "APPROVED",
      );
      if (alreadyApproved) {
        log.warn(
          { quotationId: quotation.id, stage: approval.stage },
          "Duplicate approval detected for stage",
        );
        throw new DuplicateApprovalError(quotation.id, approval.stage);
      }
    }
  }
}
