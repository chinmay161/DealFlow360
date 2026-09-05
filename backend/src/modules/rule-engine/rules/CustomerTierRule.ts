/**
 * CustomerTierRule
 *
 * Validates that the quotation respects the customer's tier privileges.
 * Each tier has configurable limits (max discount %, max order amount)
 * read from DiscountPolicy.
 *
 * Tier privilege mapping:
 *   BRONZE  → most restrictive
 *   SILVER  → moderate
 *   GOLD    → most privileged
 */

import type { Rule, RuleResult, Recommendation } from "../interfaces/Rule.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import type { RuleContext } from "../engine/RuleContext.js";

/** Numeric risk weight per tier — lower tier = higher risk. */
const TIER_RISK_WEIGHT: Record<string, number> = {
  BRONZE: 0.7,
  SILVER: 0.4,
  GOLD: 0.1,
};

export class CustomerTierRule implements Rule {
  readonly id = "customer-tier";
  readonly name = "Customer Tier Rule";
  readonly description =
    "Validates quotation parameters against customer tier privileges and limits.";

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const { customer, discountPolicies, blendedDiscountPct, quotation } = context;

    // Find tier-specific policy (PERCENTAGE type, matching tier)
    const tierPolicy = discountPolicies.find(
      (p) => p.type === "PERCENTAGE" && p.tier === customer.tier,
    );

    const maxDiscount = tierPolicy ? tierPolicy.value : 0.05; // default 5%
    const maxOrder = tierPolicy?.maxDiscount ?? null; // reuse maxDiscount field as order cap

    const discountExceeded = blendedDiscountPct > maxDiscount;
    const orderExceeded = maxOrder !== null && quotation.grandTotal > maxOrder;

    const tierRisk = TIER_RISK_WEIGHT[customer.tier] ?? 0.5;

    const passed = !discountExceeded && !orderExceeded;

    // Score: blend of tier risk + violation magnitude
    let score = tierRisk * 30; // base risk from tier
    if (discountExceeded) {
      score += Math.min(40, ((blendedDiscountPct - maxDiscount) / maxDiscount) * 40);
    }
    if (orderExceeded && maxOrder) {
      score += Math.min(30, ((quotation.grandTotal - maxOrder) / maxOrder) * 30);
    }
    score = Math.min(100, score);

    const messages: string[] = [];
    if (discountExceeded) {
      messages.push(
        `Discount ${(blendedDiscountPct * 100).toFixed(1)}% exceeds ${customer.tier} limit of ${(maxDiscount * 100).toFixed(1)}%.`,
      );
    }
    if (orderExceeded && maxOrder) {
      messages.push(
        `Order total ${quotation.grandTotal.toFixed(2)} exceeds ${customer.tier} cap of ${maxOrder.toFixed(2)}.`,
      );
    }
    if (passed) {
      messages.push(`${customer.tier} tier privileges satisfied.`);
    }

    // Near-limit warning (within 80% of ceiling)
    const nearLimit = !discountExceeded && blendedDiscountPct > maxDiscount * 0.8;
    const severity = !passed
      ? Severity.WARNING
      : nearLimit
        ? Severity.WARNING
        : Severity.INFO;

    const recommendation: Recommendation | undefined = discountExceeded
      ? {
          ruleId: this.id,
          ruleName: this.name,
          currentValue: Math.round(blendedDiscountPct * 10000) / 100,
          requiredValue: Math.round(maxDiscount * 10000) / 100,
          message: `Reduce blended discount to ${(maxDiscount * 100).toFixed(1)}% for ${customer.tier} tier compliance.`,
        }
      : undefined;

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed,
      severity,
      score,
      computedValue: blendedDiscountPct,
      threshold: maxDiscount,
      approvalRequired: !passed,
      approvalLevel: passed
        ? ApprovalLevel.AUTO_APPROVE
        : ApprovalLevel.MANAGER,
      message: messages.join(" "),
      metadata: {
        tier: customer.tier,
        tierRiskWeight: tierRisk,
        maxDiscount,
        maxOrder,
        nearLimit,
        policyId: tierPolicy?.id,
        ...(recommendation ? { recommendation } : {}),
      },
      executionTimeMs: 0,
    };
  }
}
