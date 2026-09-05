/**
 * Approval Routing — Domain Errors
 *
 * Specific exception classes for approval lifecycle events.
 * Controller maps these deterministically to HTTP status codes.
 */

export abstract class ApprovalRoutingError extends Error {
  abstract readonly statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** 404 — Quotation not found */
export class QuotationNotFoundError extends ApprovalRoutingError {
  readonly statusCode = 404;
  constructor(quotationId: string) {
    super(`Quotation not found: ${quotationId}`);
  }
}

/** 404 — Approval record not found */
export class ApprovalNotFoundError extends ApprovalRoutingError {
  readonly statusCode = 404;
  constructor(approvalId: string) {
    super(`Approval record not found: ${approvalId}`);
  }
}

/** 422 — No eligible approver available for role */
export class ApproverNotFoundError extends ApprovalRoutingError {
  readonly statusCode = 422;
  constructor(role: string, quotationId?: string) {
    super(
      `No active approver found for role "${role}"${
        quotationId ? ` on quotation "${quotationId}"` : ""
      }`,
    );
  }
}

/** 409 — Approval already completed (APPROVED / REJECTED) */
export class ApprovalAlreadyCompletedError extends ApprovalRoutingError {
  readonly statusCode = 409;
  constructor(approvalId: string, currentStatus: string) {
    super(`Approval "${approvalId}" has already been processed with status "${currentStatus}"`);
  }
}

/** 409 — Duplicate approval attempt for stage */
export class DuplicateApprovalError extends ApprovalRoutingError {
  readonly statusCode = 409;
  constructor(quotationId: string, stage: number) {
    super(`Approval for stage ${stage} already exists or is already processed for quotation "${quotationId}"`);
  }
}

/** 403 — User not authorized to act on this approval */
export class UnauthorizedApproverError extends ApprovalRoutingError {
  readonly statusCode = 403;
  constructor(userId: string, assignedApproverId: string) {
    super(`User "${userId}" is not authorized. This approval is assigned to "${assignedApproverId}"`);
  }
}

/** 422 — Invalid workflow state transition */
export class InvalidWorkflowTransitionError extends ApprovalRoutingError {
  readonly statusCode = 422;
  constructor(fromState: string, action: string, reason?: string) {
    super(
      `Cannot perform "${action}" when workflow/quotation is in state "${fromState}"${
        reason ? `: ${reason}` : ""
      }`,
    );
  }
}

/** 422 — Skipped stages in multi-stage approval */
export class SkippedStageError extends ApprovalRoutingError {
  readonly statusCode = 422;
  constructor(currentStage: number, attemptedStage: number) {
    super(`Cannot approve stage ${attemptedStage} before stage ${currentStage} is approved`);
  }
}
