/**
 * Quotation State Machine — Domain Errors
 *
 * Specific exception classes for quotation state lifecycle events.
 * Controller maps these deterministically to HTTP status codes (especially 409 for invalid transitions).
 */

export abstract class QuotationStateError extends Error {
  abstract readonly statusCode: number;
  readonly code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code ?? this.constructor.name;
  }
}

/**
 * 409 Conflict — Illegal or unsupported state transition.
 * Examples:
 *   Draft -> Fulfilled
 *   Rejected -> Approved
 *   Closed -> Draft
 */
export class InvalidTransitionError extends QuotationStateError {
  readonly statusCode = 409;
  constructor(
    public readonly fromState: string,
    public readonly toState: string,
    public readonly reason?: string,
  ) {
    super(
      `Cannot transition quotation from state "${fromState}" to "${toState}"${
        reason ? `: ${reason}` : "."
      }`,
      "INVALID_STATE_TRANSITION",
    );
  }
}

/**
 * 404 Not Found — Quotation does not exist in database.
 */
export class QuotationNotFoundError extends QuotationStateError {
  readonly statusCode = 404;
  constructor(public readonly quotationId: string) {
    super(`Quotation not found: ${quotationId}`, "QUOTATION_NOT_FOUND");
  }
}

/**
 * 404 Not Found — Actor/User record does not exist.
 */
export class ActorNotFoundError extends QuotationStateError {
  readonly statusCode = 404;
  constructor(public readonly actorId: string) {
    super(`Actor not found: ${actorId}`, "ACTOR_NOT_FOUND");
  }
}

/**
 * 403 Forbidden — Actor lacks permissions to execute transition.
 */
export class UnauthorizedTransitionError extends QuotationStateError {
  readonly statusCode = 403;
  constructor(
    public readonly actorId: string,
    public readonly actorRole: string,
    public readonly fromState: string,
    public readonly toState: string,
  ) {
    super(
      `Actor "${actorId}" with role "${actorRole}" is not authorized to transition from "${fromState}" to "${toState}"`,
      "UNAUTHORIZED_TRANSITION",
    );
  }
}

/**
 * 409 Conflict — Transition to Approved requires all approval stages to be completed.
 */
export class ApprovalIncompleteError extends QuotationStateError {
  readonly statusCode = 409;
  constructor(
    public readonly quotationId: string,
    public readonly pendingStage?: number,
    public readonly details?: string,
  ) {
    super(
      `Cannot transition quotation "${quotationId}" to Approved. Approvals are incomplete${
        pendingStage ? ` (pending stage ${pendingStage})` : ""
      }${details ? `: ${details}` : "."}`,
      "APPROVAL_INCOMPLETE",
    );
  }
}

/**
 * 400 Bad Request — Unrecognized state string provided.
 */
export class InvalidStateError extends QuotationStateError {
  readonly statusCode = 400;
  constructor(public readonly state: string) {
    super(`Invalid quotation state: "${state}"`, "INVALID_STATE");
  }
}
