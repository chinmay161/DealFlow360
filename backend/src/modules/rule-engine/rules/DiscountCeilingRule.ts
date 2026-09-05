/**
 * DiscountCeilingRule
 *
 * Validates that the discount % on every quotation line does not exceed
 * the ceiling defined in the DiscountPolicy for the customer's tier.
 *
 * Threshold comes from DB: DiscountPolicy.value (where type = PERCENTAGE).
 * If no policy exists for the tier, the rule passes with a warning.
 */

import type { Rule, RuleResult, Recommendation } from "../interfaces/Rule.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import type { RuleContext } from "../engine/RuleContext.js";

export class DiscountCeilingRule implements Rule {
  readonly id = "discount-ceiling";
  readonly name = "Discount Ceiling Rule";
  readonly description =
    "Ensures line-level discounts do not exceed the tier-specific ceiling defined in discount policies.";

  async evaluate(context: RuleContext): Promise<RuleResult> {
    const { customer, lines, discountPolicies } = context;

    // Find the PERCENTAGE discount policy for this customer's tier (or global)
    const policy = discountPolicies.find(
      (p) =>
        p.type === "PERCENTAGE" &&
        (p.tier === customer.tier || p.tier === null),
    );

    // No policy → pass with info (no ceiling configured)
    if (!policy) {
      return this.pass(0, 0, "No discount ceiling policy configured for this tier.");
    }

    const ceiling = policy.value; // e.g. 0.10 = 10%

    // Find the worst-offending line
    let maxDiscountPct = 0;
    let offendingLineSku = "";

    for (const line of lines) {
      if (line.discountPct > maxDiscountPct) {
        maxDiscountPct = line.discountPct;
        offendingLineSku = line.product.sku;
      }
    }

    const passed = maxDiscountPct <= ceiling;
    const score = passed ? 0 : Math.min(100, ((maxDiscountPct - ceiling) / ceiling) * 100);

    const recommendation: Recommendation | undefined = passed
      ? undefined
      : {
          ruleId: this.id,
          ruleName: this.name,
          currentValue: Math.round(maxDiscountPct * 10000) / 100, // → %
          requiredValue: Math.round(ceiling * 10000) / 100,
          message: `Reduce discount on ${offendingLineSku} from ${(maxDiscountPct * 100).toFixed(1)}% to at most ${(ceiling * 100).toFixed(1)}%.`,
        };

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed,
      severity: passed ? Severity.INFO : Severity.WARNING,
      score,
      computedValue: maxDiscountPct,
      threshold: ceiling,
      approvalRequired: !passed,
      approvalLevel: passed ? ApprovalLevel.AUTO_APPROVE : ApprovalLevel.MANAGER,
      message: passed
        ? `All line discounts within ceiling (max ${(maxDiscountPct * 100).toFixed(1)}% ≤ ${(ceiling * 100).toFixed(1)}%).`
        : `Line ${offendingLineSku} has ${(maxDiscountPct * 100).toFixed(1)}% discount, exceeding the ${(ceiling * 100).toFixed(1)}% ceiling.`,
      metadata: {
        maxDiscountPct,
        ceiling,
        offendingLineSku: offendingLineSku || undefined,
        policyId: policy.id,
        ...(recommendation ? { recommendation } : {}),
      },
      executionTimeMs: 0, // overridden by executor
    };
  }

  private pass(computed: number, threshold: number, message: string): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      severity: Severity.INFO,
      score: 0,
      computedValue: computed,
      threshold,
      approvalRequired: false,
      approvalLevel: ApprovalLevel.AUTO_APPROVE,
      message,
      metadata: {},
      executionTimeMs: 0,
    };
  }
}
