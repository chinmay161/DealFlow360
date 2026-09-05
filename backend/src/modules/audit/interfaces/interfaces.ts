/**
 * Audit Logging Module — Service Interfaces
 */

import type {
  LogAuditParams,
  AuditRecordDomain,
  AuditQueryFilters,
  PaginationParams,
  PaginatedAuditResult,
  AuditContext,
} from "../types/types.js";

export interface IAuditService {
  log(params: LogAuditParams): Promise<AuditRecordDomain | null>;
}

export interface IAuditQueryService {
  query(
    filters?: AuditQueryFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedAuditResult>;

  getEntityTimeline(
    entity: string,
    entityId: string,
  ): Promise<AuditRecordDomain[]>;

  getUserActivity(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedAuditResult>;
}

export interface IAuditContextBuilder {
  buildContext(req: any): AuditContext;
}
