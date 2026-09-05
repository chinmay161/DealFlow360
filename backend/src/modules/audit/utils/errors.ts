/**
 * Audit Logging Module — Domain Errors
 */

export abstract class AuditError extends Error {
  abstract readonly statusCode: number;
  readonly code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code ?? this.constructor.name;
  }
}

/**
 * 400 Bad Request — Invalid audit query parameters or date formats.
 */
export class InvalidAuditQueryError extends AuditError {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message, "INVALID_AUDIT_QUERY");
  }
}

/**
 * 401 Unauthorized — Authentication context missing.
 */
export class UnauthorizedError extends AuditError {
  readonly statusCode = 401;
  constructor(message = "Authentication required to access audit logs.") {
    super(message, "UNAUTHORIZED");
  }
}

/**
 * 403 Forbidden — Non-admin attempting to view audit logs.
 */
export class ForbiddenError extends AuditError {
  readonly statusCode = 403;
  constructor(message = "Only administrators are authorized to access audit logs.") {
    super(message, "FORBIDDEN");
  }
}
