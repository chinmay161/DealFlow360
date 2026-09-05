/**
 * CategoryDiscountRule
 *
 * Validates per-category discount limits. Different product categories may
 * have different acceptable discount thresholds.
 *
 * Groups quotation lines by category and checks each group's average
 * discount against the relevant policy. Supports mixed-category quotations.
 *
 * Threshold source: DiscountPolicy rows where type matches and tier is
 * relevant. Category matching is done by policy name convention
 * (e.g. "Hardware Discount Limit", "Software Discount Limit").
 */

import type { Rule, RuleResult, Recommendation } from "../interfaces/Rule.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import type { RuleContext, ContextQuotationLine } from "../engine/RuleContext.js";

interface CategoryViolation {
  category: string;
  avgDiscountPct: number;
  ceiling: number;
  policyId: string;
}

export class CategoryDiscountRule implements Rule {
  readonly id = "category-discount";
  readonly name = "Category Discount Rule";
  readonly description =
    "Validates that per-category average discounts do not exceed category-specific limits.";

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const { lines, discountPolicies, customer } = context;

    // Group lines by category
    const grouped = new Map<string, ContextQuotationLine[]>();
    for (const line of lines) {
      const cat = line.product.categoryName;
      const arr = grouped.get(cat) ?? [];
      arr.push(line);
      grouped.set(cat, arr);
    }

    const violations: CategoryViolation[] = [];
    let worstOverage = 0;

    for (const [category, catLines] of grouped) {
      // Find a policy whose name contains the category name (case-insensitive)
      const categoryLower = category.toLowerCase();
      const policy = discountPolicies.find(
        (p) =>
          p.name.toLowerCase().includes(categoryLower) &&
          (p.tier === customer.tier || p.tier === null),
      );

      if (!policy) continue; // no limit for this category → skip

      // Weighted average discount for this category
      const totalRev = catLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const avgDiscount =
        totalRev > 0
          ? catLines.reduce((s, l) => s + l.discountPct * l.unitPrice * l.quantity, 0) / totalRev
          : 0;

      if (avgDiscount > policy.value) {
        const overage = avgDiscount - policy.value;
        violations.push({
          category,
          avgDiscountPct: avgDiscount,
          ceiling: policy.value,
          policyId: policy.id,
        });
        if (overage > worstOverage) worstOverage = overage;
      }
    }

    const passed = violations.length === 0;
    const score = passed ? 0 : Math.min(100, (worstOverage / 0.01) * 2); // 1% over = score 2

    const recommendations: Recommendation[] = violations.map((v) => ({
      ruleId: this.id,
      ruleName: this.name,
      currentValue: Math.round(v.avgDiscountPct * 10000) / 100,
      requiredValue: Math.round(v.ceiling * 10000) / 100,
      message: `Reduce ${v.category} discount from ${(v.avgDiscountPct * 100).toFixed(1)}% to at most ${(v.ceiling * 100).toFixed(1)}%.`,
    }));

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed,
      severity: passed ? Severity.INFO : Severity.WARNING,
      score,
      computedValue: violations.length > 0 ? violations[0].avgDiscountPct : 0,
      threshold: violations.length > 0 ? violations[0].ceiling : 0,
      approvalRequired: !passed,
      approvalLevel: passed ? ApprovalLevel.AUTO_APPROVE : ApprovalLevel.MANAGER,
      message: passed
        ? "All category discounts within limits."
        : `${violations.length} category violation(s): ${violations.map((v) => `${v.category} at ${(v.avgDiscountPct * 100).toFixed(1)}%`).join(", ")}.`,
      metadata: {
        violations,
        categoryCount: grouped.size,
        ...(recommendations.length > 0 ? { recommendation: recommendations[0] } : {}),
      },
      executionTimeMs: 0,
    };
  }
}
