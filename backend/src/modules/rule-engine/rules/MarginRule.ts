/**
 * MarginRule
 *
 * Rejects quotations where the blended margin falls below the configured
 * minimum. Also flags individual lines with dangerously low margins.
 *
 * Threshold source: DiscountPolicy with type = PERCENTAGE whose name
 * contains "margin" (case-insensitive). Falls back to a 0% floor if
 * no margin policy is configured.
 */

import type { Rule, RuleResult, Recommendation } from "../interfaces/Rule.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import type { RuleContext } from "../engine/RuleContext.js";

export class MarginRule implements Rule {
  readonly id = "margin";
  readonly name = "Margin Rule";
  readonly description =
    "Ensures the blended quotation margin meets the minimum threshold.";

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const { lines, discountPolicies, customer, blendedMargin } = context;

    // Find margin-floor policy
    const marginPolicy = discountPolicies.find(
      (p) =>
        p.name.toLowerCase().includes("margin") &&
        (p.tier === customer.tier || p.tier === null),
    );

    const minMargin = marginPolicy ? marginPolicy.value : 0; // decimal, e.g. 0.15 = 15%

    // Compute per-line margins for detail
    const lineMargins = lines.map((l) => {
      const revenue = l.unitPrice * l.quantity;
      const cost = l.product.costPrice * l.quantity;
      const discount = l.discount * l.quantity;
      const netRevenue = revenue - discount;
      const margin = netRevenue > 0 ? (netRevenue - cost) / netRevenue : 0;
      return { sku: l.product.sku, margin, revenue: netRevenue, cost };
    });

    const lowestLine = lineMargins.reduce(
      (min, l) => (l.margin < min.margin ? l : min),
      lineMargins[0] ?? { sku: "N/A", margin: 1, revenue: 0, cost: 0 },
    );

    const passed = blendedMargin >= minMargin;
    const score = passed
      ? 0
      : Math.min(100, ((minMargin - blendedMargin) / (minMargin || 1)) * 100);

    // Recommend price increase to hit the margin target
    let recommendation: Recommendation | undefined;
    if (!passed && lowestLine.cost > 0) {
      // Required price = cost / (1 - minMargin)
      const requiredPrice = lowestLine.cost / (1 - minMargin);
      const priceIncrease = requiredPrice - (lowestLine.revenue > 0 ? lowestLine.revenue : 0);

      recommendation = {
        ruleId: this.id,
        ruleName: this.name,
        currentValue: Math.round(blendedMargin * 10000) / 100,
        requiredValue: Math.round(minMargin * 10000) / 100,
        message: `Increase unit price on ${lowestLine.sku} by ≈${Math.ceil(priceIncrease)} to achieve ${(minMargin * 100).toFixed(0)}% margin.`,
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed,
      severity: passed ? Severity.INFO : Severity.CRITICAL,
      score,
      computedValue: blendedMargin,
      threshold: minMargin,
      approvalRequired: !passed,
      approvalLevel: passed
        ? ApprovalLevel.AUTO_APPROVE
        : ApprovalLevel.FINANCE,
      message: passed
        ? `Blended margin ${(blendedMargin * 100).toFixed(1)}% meets minimum ${(minMargin * 100).toFixed(1)}%.`
        : `Blended margin ${(blendedMargin * 100).toFixed(1)}% is below minimum ${(minMargin * 100).toFixed(1)}%. Lowest: ${lowestLine.sku} at ${(lowestLine.margin * 100).toFixed(1)}%.`,
      metadata: {
        blendedMargin,
        minMargin,
        lowestLineSku: lowestLine.sku,
        lowestLineMargin: lowestLine.margin,
        policyId: marginPolicy?.id,
        ...(recommendation ? { recommendation } : {}),
      },
      executionTimeMs: 0,
    };
  }
}
