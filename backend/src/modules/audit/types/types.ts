/**
 * Audit Logging Module — Domain Types
 *
 * Types for audit events, logging parameters, query filters, and domain models.
 */

import type { AuditAction } from "@prisma/client";

export type { AuditAction };

/**
 * Standard audit event categories and action names across DealFlow360.
 */
export const AuditEvent = {
  // Authentication
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  FAILED_LOGIN: "FAILED_LOGIN",
  TOKEN_REFRESH: "TOKEN_REFRESH",

  // Quotation Lifecycle
  QUOTATION_CREATED: "QUOTATION_CREATED",
  QUOTATION_UPDATED: "QUOTATION_UPDATED",
  QUOTATION_SUBMITTED: "QUOTATION_SUBMITTED",
  STATE_TRANSITION: "STATE_TRANSITION",
  QUOTATION_CANCELLED: "QUOTATION_CANCELLED",

  // Rule Engine
  EVALUATION_STARTED: "EVALUATION_STARTED",
  EVALUATION_COMPLETED: "EVALUATION_COMPLETED",

  // Approval Routing
  WORKFLOW_STARTED: "WORKFLOW_STARTED",
  APPROVAL_ASSIGNED: "APPROVAL_ASSIGNED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RETURNED: "RETURNED",

  // Discount Configuration
  DISCOUNT_POLICY_CREATED: "DISCOUNT_POLICY_CREATED",
  DISCOUNT_POLICY_UPDATED: "DISCOUNT_POLICY_UPDATED",
  DISCOUNT_POLICY_DELETED: "DISCOUNT_POLICY_DELETED",
  APPROVAL_RULE_CREATED: "APPROVAL_RULE_CREATED",
  APPROVAL_RULE_UPDATED: "APPROVAL_RULE_UPDATED",
  APPROVAL_RULE_DELETED: "APPROVAL_RULE_DELETED",

  // Counterfactual Engine
  RECOMMENDATION_GENERATED: "RECOMMENDATION_GENERATED",
  SIMULATION_EXECUTED: "SIMULATION_EXECUTED",

  // System
  SYSTEM_ERROR: "SYSTEM_ERROR",
  SYSTEM_WARNING: "SYSTEM_WARNING",
} as const;

export type AuditEventType = (typeof AuditEvent)[keyof typeof AuditEvent] | string;

/**
 * Input parameters to auditService.log()
 */
export interface LogAuditParams {
  userId?: string | null;
  action: AuditEventType;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  tx?: any; // optional Prisma transaction client
}

/**
 * Contextual metadata captured automatically by AuditMiddleware or AuditContextBuilder.
 */
export interface AuditContext {
  requestId: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  startTime: number;
}

/**
 * Normalized domain representation of an immutable audit record.
 */
export interface AuditRecordDomain {
  id: string;
  userId: string | null;
  user?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  requestId?: string;
  createdAt: Date;
}

/**
 * Query filters supported by GET /api/v1/audit
 */
export interface AuditQueryFilters {
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  from?: Date | string;
  to?: Date | string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedAuditResult {
  items: AuditRecordDomain[];
  total: number;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
