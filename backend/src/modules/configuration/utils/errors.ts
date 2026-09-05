/**
 * Discount Configuration Module — Domain Errors
 *
 * Specific exception classes for policy and rule validation, duplicates, overlaps,
 * authorization, and not found conditions.
 */

export abstract class ConfigurationError extends Error {
  abstract readonly statusCode: number;
  readonly code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code ?? this.constructor.name;
  }
}

/**
 * 400 Bad Request — Input validation failure (e.g. invalid percentage, negative numbers, bad category).
 */
export class ValidationError extends ConfigurationError {
  readonly statusCode = 400;
  constructor(message: string, public readonly details?: Record<string, any>) {
    super(message, "VALIDATION_ERROR");
  }
}

/**
 * 409 Conflict — Duplicate policy or rule.
 */
export class DuplicateEntityError extends ConfigurationError {
  readonly statusCode = 409;
  constructor(entityType: string, identifier: string) {
    super(
      `Duplicate ${entityType} detected: an active record with "${identifier}" already exists.`,
      "DUPLICATE_ENTITY",
    );
  }
}

/**
 * 409 Conflict — Overlapping date range or quotation value range.
 */
export class RangeOverlapError extends ConfigurationError {
  readonly statusCode = 409;
  constructor(entityType: string, reason: string) {
    super(
      `Overlapping range in ${entityType}: ${reason}`,
      "RANGE_OVERLAP",
    );
  }
}

/**
 * 404 Not Found — Entity record not found.
 */
export class EntityNotFoundError extends ConfigurationError {
  readonly statusCode = 404;
  constructor(entityType: string, id: string) {
    super(`${entityType} with ID "${id}" was not found.`, "NOT_FOUND");
  }
}

/**
 * 401 Unauthorized — Authentication context missing or invalid.
 */
export class UnauthorizedError extends ConfigurationError {
  readonly statusCode = 401;
  constructor(message = "Authentication required to access this resource.") {
    super(message, "UNAUTHORIZED");
  }
}

/**
 * 403 Forbidden — Actor lacks sufficient privileges (e.g. non-admin attempting write).
 */
export class ForbiddenError extends ConfigurationError {
  readonly statusCode = 403;
  constructor(message = "Only administrators are authorized to perform this operation.") {
    super(message, "FORBIDDEN");
  }
}
