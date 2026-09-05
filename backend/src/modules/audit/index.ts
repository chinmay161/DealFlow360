/**
 * Audit Logging Module — Public API
 *
 * Centralized, append-only audit logging across the entire application.
 * Exposes:
 *   - Singleton `auditService` for recording audit events
 *   - `AuditQueryService` for querying audit logs
 *   - `AuditContextBuilder` for extracting request context
 *   - `auditMiddleware` Express middleware for request tracing & context
 *   - `createAuditRouter` Express router factory
 *   - Domain types, interfaces, DTOs, and error classes
 */

import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./services/AuditService.js";
import { AuditQueryService } from "./services/AuditQueryService.js";
import { AuditContextBuilder } from "./services/AuditContextBuilder.js";

// Export singleton instances for standard application use
export const auditService = new AuditService(prisma);
export const auditQueryService = new AuditQueryService(prisma);
export const auditContextBuilder = new AuditContextBuilder();

// Export classes
export { AuditService } from "./services/AuditService.js";
export { AuditQueryService } from "./services/AuditQueryService.js";
export { AuditContextBuilder } from "./services/AuditContextBuilder.js";
export { AuditController } from "./controllers/AuditController.js";

// Export middleware
export { auditMiddleware } from "./middleware/AuditMiddleware.js";
export { requireAdmin, extractUser } from "./middleware/auth.js";

// Export router
export { createAuditRouter } from "./routes/routes.js";

// Export interfaces & types
export type {
  IAuditService,
  IAuditQueryService,
  IAuditContextBuilder,
} from "./interfaces/interfaces.js";

export type {
  AuditRecordDomain,
  LogAuditParams,
  AuditEvent,
  AuditQueryFilters,
  PaginationParams,
  PaginatedAuditResult,
  AuditContext,
} from "./types/types.js";

// Export errors
export {
  AuditError,
  InvalidAuditQueryError,
  UnauthorizedError,
  ForbiddenError,
} from "./utils/errors.js";

// Export DTOs / schemas
export {
  AuditQuerySchema,
  EntityTimelineParamSchema,
  UserIdParamSchema,
  LogAuditSchema,
  LogAuditSchema as LogAuditPayloadSchema,
} from "./dto/dto.js";
