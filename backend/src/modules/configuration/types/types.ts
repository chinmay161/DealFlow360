/**
 * Discount Configuration Module — Domain Types
 *
 * Types for Discount Policies, Approval Rules, filters, and pagination.
 */

import type { CustomerTier, RoleType } from "@prisma/client";

export type { CustomerTier, RoleType };

export interface DiscountPolicyDomain {
  id: string;
  name: string;
  description?: string;
  customerTier: CustomerTier | string | null;
  productCategory: string;
  maximumDiscount: number; // percentage fraction (0.00 to 1.00)
  minimumMargin: number;   // percentage fraction (0.00 to 1.00)
  active: boolean;
  effectiveDate: Date | null;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRuleDomain {
  id: string;
  name: string;
  description?: string;
  approvalLevel: string; // e.g. "MANAGER", "FINANCE", "EXECUTIVE", "ADMIN"
  stage: number;         // 1, 2, 3...
  threshold: number;     // discount percentage threshold
  riskThreshold: number | null; // risk score threshold (0.00 to 100.00)
  minimumQuotationValue: number | null;
  maximumQuotationValue: number | null;
  priority: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountPolicyFilter {
  customerTier?: CustomerTier | string;
  category?: string;
  active?: boolean;
}

export interface ApprovalRuleFilter {
  level?: string;
  active?: boolean;
  stage?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
