/**
 * Discount Configuration Module — Service Interfaces
 */

import type {
  DiscountPolicyDomain,
  ApprovalRuleDomain,
  DiscountPolicyFilter,
  ApprovalRuleFilter,
  PaginationParams,
  PaginatedResult,
} from "../types/types.js";

export interface CreateDiscountPolicyInput {
  name?: string;
  customerTier?: string | null;
  productCategory: string;
  maximumDiscount: number;
  minimumMargin: number;
  active?: boolean;
  effectiveDate?: string | Date | null;
  expiryDate?: string | Date | null;
  description?: string;
}

export interface UpdateDiscountPolicyInput {
  name?: string;
  customerTier?: string | null;
  productCategory?: string;
  maximumDiscount?: number;
  minimumMargin?: number;
  active?: boolean;
  effectiveDate?: string | Date | null;
  expiryDate?: string | Date | null;
  description?: string;
}

export interface CreateApprovalRuleInput {
  name?: string;
  approvalLevel: string;
  stage: number;
  threshold?: number;
  riskThreshold?: number | null;
  minimumQuotationValue?: number | null;
  maximumQuotationValue?: number | null;
  priority?: number;
  active?: boolean;
  description?: string;
}

export interface UpdateApprovalRuleInput {
  name?: string;
  approvalLevel?: string;
  stage?: number;
  threshold?: number;
  riskThreshold?: number | null;
  minimumQuotationValue?: number | null;
  maximumQuotationValue?: number | null;
  priority?: number;
  active?: boolean;
  description?: string;
}

export interface IDiscountPolicyService {
  create(data: CreateDiscountPolicyInput, actorId?: string): Promise<DiscountPolicyDomain>;
  update(id: string, data: UpdateDiscountPolicyInput, actorId?: string): Promise<DiscountPolicyDomain>;
  delete(id: string, actorId?: string): Promise<void>;
  getById(id: string): Promise<DiscountPolicyDomain>;
  list(
    filter?: DiscountPolicyFilter,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<DiscountPolicyDomain>>;
}

export interface IApprovalRuleService {
  create(data: CreateApprovalRuleInput, actorId?: string): Promise<ApprovalRuleDomain>;
  update(id: string, data: UpdateApprovalRuleInput, actorId?: string): Promise<ApprovalRuleDomain>;
  delete(id: string, actorId?: string): Promise<void>;
  getById(id: string): Promise<ApprovalRuleDomain>;
  list(
    filter?: ApprovalRuleFilter,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ApprovalRuleDomain>>;
}

export interface IValidationService {
  validateDiscountPolicy(
    data: CreateDiscountPolicyInput | UpdateDiscountPolicyInput,
    existingId?: string,
  ): Promise<void>;
  validateApprovalRule(
    data: CreateApprovalRuleInput | UpdateApprovalRuleInput,
    existingId?: string,
  ): Promise<void>;
}
