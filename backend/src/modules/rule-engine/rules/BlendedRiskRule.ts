/**
 * BlendedRiskRule
 *
 * Computes a normalized 0–100 risk score by blending multiple weighted
 * factors. This score is the "overallRiskScore" in the RuleEngineResult
 * and is also persisted on Quotation.riskScore.
 *
 * Factors & weights (analytical, not DB-configurable):
 *   Discount deviation  — 30%
 *   Customer tier risk   — 15%
 *   Order value magnitude— 20%
 *   Failed rule count    — 25%
 *   Category diversity   — 10%
 */

import type { Rule, RuleResult } from "../interfaces/Rule.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import type { RuleContext } from "../engine/RuleContext.js";

// ─── Weight constants ────────────────────────────────────────────────────────

const W_DISCOUNT = 0.30;
const W_TIER = 0.15;
const W_ORDER_VALUE = 0.20;
const W_FAILED_RULES = 0.25;
const W_CATEGORY_MIX = 0.10;

/** Tier risk factor: lower tier = higher risk. */
const TIER_RISK: Record<string, number> = {
  BRONZE: 80,
  SILVER: 40,
  GOLD: 10,
};

/**
 * Order value thresholds for risk scoring.
 * Orders above HIGH are scored at 80+; below LOW at ~10.
 */
const ORDER_VALUE_LOW = 10_000;
const ORDER_VALUE_HIGH = 100_000;

export class BlendedRiskRule implements Rule {
  readonly id = "blended-risk";
  readonly name = "Blended Risk Rule";
  readonly description =
    "Computes a normalized 0–100 risk score from discount, tier, order value, failed rules, and category mix.";

  async evaluate(context: RuleContext, priorResults: RuleResult[] = []): Promise<RuleResult> {
    const { blendedDiscountPct, customer, quotation, categories, discountPolicies } = context;

    // 1. Discount deviation score (0–100)
    //    How far is the discount from the tier ceiling?
    const ceilingPolicy = discountPolicies.find(
      (p) => p.type === "PERCENTAGE" && (p.tier === customer.tier || p.tier === null),
    );
    const ceiling = ceilingPolicy ? ceilingPolicy.value : 0.05;
    const discountScore =
      ceiling > 0
        ? Math.min(100, (blendedDiscountPct / ceiling) * 100)
        : blendedDiscountPct > 0 ? 100 : 0;

    // 2. Tier risk score
    const tierScore = TIER_RISK[customer.tier] ?? 50;

    // 3. Order value score (linear interpolation between LOW and HIGH)
    const orderVal = quotation.grandTotal;
    let orderScore: number;
    if (orderVal <= ORDER_VALUE_LOW) {
      orderScore = 10;
    } else if (orderVal >= ORDER_VALUE_HIGH) {
      orderScore = 90;
    } else {
      orderScore = 10 + ((orderVal - ORDER_VALUE_LOW) / (ORDER_VALUE_HIGH - ORDER_VALUE_LOW)) * 80;
    }

    // 4. Failed/warned rules score
    const failedCount = priorResults.filter((r) => !r.passed).length;
    const warnedCount = priorResults.filter(
      (r) => r.passed && r.severity === Severity.WARNING,
    ).length;
    const totalChecked = priorResults.length || 1;
    const failScore = Math.min(100, ((failedCount * 2 + warnedCount) / totalChecked) * 100);

    // 5. Category mix score (more categories = more complexity = higher risk)
    const catCount = categories.length;
    const catScore = Math.min(100, catCount * 20); // 5+ categories → 100

    // ── Weighted blend ───────────────────────────────────────────────────

    const riskScore =
      discountScore * W_DISCOUNT +
      tierScore * W_TIER +
      orderScore * W_ORDER_VALUE +
      failScore * W_FAILED_RULES +
      catScore * W_CATEGORY_MIX;

    const finalScore = Math.round(Math.min(100, Math.max(0, riskScore)) * 100) / 100;

    // Risk thresholds for severity
    const severity =
      finalScore >= 75
        ? Severity.CRITICAL
        : finalScore >= 40
          ? Severity.WARNING
          : Severity.INFO;

    const passed = finalScore < 75; // above 75 is a hard fail

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed,
      severity,
      score: finalScore,
      computedValue: finalScore,
      threshold: 75, // risk threshold
      approvalRequired: finalScore >= 40,
      approvalLevel:
        finalScore >= 75
          ? ApprovalLevel.EXECUTIVE
          : finalScore >= 40
            ? ApprovalLevel.FINANCE
            : ApprovalLevel.AUTO_APPROVE,
      message: `Blended risk score: ${finalScore.toFixed(1)}/100 (discount=${discountScore.toFixed(0)}, tier=${tierScore}, order=${orderScore.toFixed(0)}, fails=${failScore.toFixed(0)}, categories=${catScore}).`,
      metadata: {
        weights: { W_DISCOUNT, W_TIER, W_ORDER_VALUE, W_FAILED_RULES, W_CATEGORY_MIX },
        components: {
          discountScore: Math.round(discountScore * 100) / 100,
          tierScore,
          orderScore: Math.round(orderScore * 100) / 100,
          failScore: Math.round(failScore * 100) / 100,
          catScore,
        },
        failedRuleCount: failedCount,
        warnedRuleCount: warnedCount,
      },
      executionTimeMs: 0,
    };
  }
}
