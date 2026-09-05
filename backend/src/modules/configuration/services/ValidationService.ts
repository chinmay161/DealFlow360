/**
 * ValidationService
 *
 * Implements business validation rules:
 * - Duplicate rule/policy detection
 * - Date range overlap detection for discount policies
 * - Quotation value range overlap detection for approval rules
 * - Percentage boundary checks (0.00 to 1.00)
 * - Category and Customer Tier validity checks
 */

import type { PrismaClient } from "@prisma/client";
import type { IValidationService, CreateDiscountPolicyInput, UpdateDiscountPolicyInput, CreateApprovalRuleInput, UpdateApprovalRuleInput } from "../interfaces/interfaces.js";
import {
  ValidationError,
  DuplicateEntityError,
  RangeOverlapError,
} from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("config-validation-service");

const VALID_TIERS = ["BRONZE", "SILVER", "GOLD", "ALL", null, undefined];

export class ValidationService implements IValidationService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Validate a Discount Policy before creation or update.
   */
  async validateDiscountPolicy(
    data: CreateDiscountPolicyInput | UpdateDiscountPolicyInput,
    existingId?: string,
  ): Promise<void> {
    // 1. Percentage boundaries
    if (data.maximumDiscount !== undefined) {
      if (data.maximumDiscount < 0 || data.maximumDiscount > 1) {
        throw new ValidationError("maximumDiscount must be between 0.00 and 1.00 (e.g. 0.15 = 15%)");
      }
    }

    if (data.minimumMargin !== undefined) {
      if (data.minimumMargin < 0 || data.minimumMargin > 1) {
        throw new ValidationError("minimumMargin must be between 0.00 and 1.00 (e.g. 0.20 = 20%)");
      }
    }

    if (data.maximumDiscount !== undefined && data.minimumMargin !== undefined) {
      if (data.maximumDiscount + data.minimumMargin > 1) {
        throw new ValidationError("The sum of maximumDiscount and minimumMargin cannot exceed 1.00 (100%)");
      }
    }

    // 2. Customer tier validation
    if (data.customerTier !== undefined && data.customerTier !== null) {
      const normalizedTier = String(data.customerTier).toUpperCase();
      if (!VALID_TIERS.includes(normalizedTier)) {
        throw new ValidationError(
          `Invalid customerTier "${data.customerTier}". Valid tiers are: BRONZE, SILVER, GOLD.`,
        );
      }
    }

    // 3. Category validation
    if (data.productCategory !== undefined) {
      const trimmedCategory = data.productCategory.trim();
      if (!trimmedCategory) {
        throw new ValidationError("productCategory cannot be empty.");
      }

      // Check if Category model is queryable
      if ((this.prisma as any).category?.findFirst) {
        const categoryRecord = await (this.prisma as any).category.findFirst({
          where: {
            name: {
              equals: trimmedCategory,
              mode: "insensitive",
            },
          },
        });

        if (!categoryRecord) {
          // If no categories exist in DB at all, allow bootstrapping; otherwise validate existence
          const totalCategories = await (this.prisma as any).category.count().catch(() => 0);
          if (totalCategories > 0) {
            throw new ValidationError(
              `Category "${trimmedCategory}" does not exist in the product catalog.`,
            );
          }
        }
      }
    }

    // 4. Duplicate & Date Range Overlap detection
    await this.checkDiscountPolicyOverlaps(data, existingId);
  }

  /**
   * Check for duplicate policies or overlapping effective date periods.
   */
  private async checkDiscountPolicyOverlaps(
    data: CreateDiscountPolicyInput | UpdateDiscountPolicyInput,
    existingId?: string,
  ): Promise<void> {
    const targetCategory = data.productCategory;
    const targetTier =
      data.customerTier === "ALL" || data.customerTier === "all" || !data.customerTier
        ? null
        : String(data.customerTier).toUpperCase();

    // Query existing policies for category/tier comparison
    const existingPolicies = await this.prisma.discountPolicy.findMany({
      where: {
        isActive: true,
        ...(existingId ? { id: { not: existingId } } : {}),
      },
    });

    const newStart = data.effectiveDate ? new Date(data.effectiveDate).getTime() : -Infinity;
    const newEnd = data.expiryDate ? new Date(data.expiryDate).getTime() : Infinity;

    for (const p of existingPolicies) {
      // Parse policy category from policy or name
      const meta = this.parsePolicyMeta(p);
      const policyCategory = meta.category ?? this.extractCategoryFromName(p.name);
      const policyTier = p.tier;

      // Check if this policy matches category and tier
      const matchesCategory =
        !targetCategory ||
        !policyCategory ||
        policyCategory.toLowerCase() === targetCategory.toLowerCase();

      const matchesTier =
        targetTier === null || policyTier === null || policyTier === targetTier;

      if (matchesCategory && matchesTier) {
        const existStart = meta.effectiveDate ? new Date(meta.effectiveDate).getTime() : -Infinity;
        const existEnd = meta.expiryDate ? new Date(meta.expiryDate).getTime() : Infinity;

        // Check if date intervals overlap: !(newEnd < existStart || existEnd < newStart)
        const overlaps = !(newEnd < existStart || existEnd < newStart);

        if (overlaps) {
          if (newStart === -Infinity && newEnd === Infinity && existStart === -Infinity && existEnd === Infinity) {
            throw new DuplicateEntityError(
              "DiscountPolicy",
              `Category: ${targetCategory ?? policyCategory}, Tier: ${targetTier ?? "ALL"}`,
            );
          }
          throw new RangeOverlapError(
            "DiscountPolicy",
            `Effective dates overlap with existing policy "${p.name}" (ID: ${p.id}).`,
          );
        }
      }
    }
  }

  /**
   * Validate an Approval Rule before creation or update.
   */
  async validateApprovalRule(
    data: CreateApprovalRuleInput | UpdateApprovalRuleInput,
    existingId?: string,
  ): Promise<void> {
    // 1. Stage validation
    if (data.stage !== undefined && data.stage < 1) {
      throw new ValidationError("stage must be a positive integer (>= 1).");
    }

    // 2. Risk threshold validation
    if (data.riskThreshold !== undefined && data.riskThreshold !== null) {
      if (data.riskThreshold < 0 || data.riskThreshold > 100) {
        throw new ValidationError("riskThreshold must be between 0.00 and 100.00.");
      }
    }

    // 3. Discount threshold validation
    if (data.threshold !== undefined && data.threshold !== null) {
      if (data.threshold < 0 || data.threshold > 1) {
        throw new ValidationError("threshold must be between 0.00 and 1.00 (e.g. 0.15 = 15%).");
      }
    }

    // 4. Quotation value boundaries
    if (
      data.minimumQuotationValue !== undefined &&
      data.minimumQuotationValue !== null &&
      data.maximumQuotationValue !== undefined &&
      data.maximumQuotationValue !== null
    ) {
      if (data.minimumQuotationValue > data.maximumQuotationValue) {
        throw new ValidationError(
          "maximumQuotationValue must be greater than or equal to minimumQuotationValue.",
        );
      }
    }

    // 5. Overlap detection for quotation value ranges
    await this.checkApprovalRuleOverlaps(data, existingId);
  }

  /**
   * Check for duplicate rules or overlapping quotation value ranges at the same level & stage.
   */
  private async checkApprovalRuleOverlaps(
    data: CreateApprovalRuleInput | UpdateApprovalRuleInput,
    existingId?: string,
  ): Promise<void> {
    const targetStage = data.stage;
    const targetLevel = data.approvalLevel ? data.approvalLevel.toUpperCase() : undefined;

    const existingRules = await this.prisma.approvalRule.findMany({
      where: {
        isActive: true,
        ...(existingId ? { id: { not: existingId } } : {}),
      },
    });

    const newMin =
      data.minimumQuotationValue !== undefined && data.minimumQuotationValue !== null
        ? Number(data.minimumQuotationValue)
        : -Infinity;
    const newMax =
      data.maximumQuotationValue !== undefined && data.maximumQuotationValue !== null
        ? Number(data.maximumQuotationValue)
        : Infinity;

    for (const r of existingRules) {
      const meta = this.parseRuleMeta(r);
      const ruleLevel = (meta.approvalLevel ?? r.approverRole).toUpperCase();
      const ruleStage = r.stage;

      const sameStage = targetStage === undefined || ruleStage === targetStage;
      const sameLevel = targetLevel === undefined || ruleLevel === targetLevel;

      if (sameStage && sameLevel) {
        const existMin = meta.minQuotationValue !== undefined && meta.minQuotationValue !== null
          ? Number(meta.minQuotationValue)
          : -Infinity;
        const existMax = meta.maxQuotationValue !== undefined && meta.maxQuotationValue !== null
          ? Number(meta.maxQuotationValue)
          : Infinity;

        // Check if value intervals overlap
        const overlaps = !(newMax < existMin || existMax < newMin);

        if (overlaps) {
          if (newMin === -Infinity && newMax === Infinity && existMin === -Infinity && existMax === Infinity) {
            throw new DuplicateEntityError(
              "ApprovalRule",
              `Stage ${targetStage ?? ruleStage}, Level: ${targetLevel ?? ruleLevel}`,
            );
          }
          throw new RangeOverlapError(
            "ApprovalRule",
            `Quotation value range [$${newMin === -Infinity ? 0 : newMin} - $${newMax === Infinity ? "∞" : newMax}] overlaps with existing rule "${r.name}" (ID: ${r.id}).`,
          );
        }
      }
    }
  }

  // ── Helper parsers ─────────────────────────────────────────────────────────

  private parsePolicyMeta(policy: any): Record<string, any> {
    if (!policy.description) return {};
    try {
      return JSON.parse(policy.description);
    } catch {
      return {};
    }
  }

  private parseRuleMeta(rule: any): Record<string, any> {
    if (!rule.description) return {};
    try {
      return JSON.parse(rule.description);
    } catch {
      return {};
    }
  }

  private extractCategoryFromName(name: string): string | null {
    // E.g. "Hardware Gold Discount Policy" -> "Hardware"
    const words = name.split(" ");
    return words.length > 0 ? words[0] : null;
  }
}
