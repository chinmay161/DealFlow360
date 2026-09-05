import { describe, it, expect } from "vitest";
import { BlendedRiskRule } from "../rules/BlendedRiskRule.js";
import { Severity } from "../interfaces/Rule.js";
import { mockContext, mockCustomer, mockQuotation, mockDiscountPolicy } from "./helpers.js";
import type { RuleResult } from "../interfaces/Rule.js";
import { ApprovalLevel } from "../interfaces/Rule.js";

const rule = new BlendedRiskRule();

function makePriorResult(overrides: Partial<RuleResult> = {}): RuleResult {
  return {
    ruleId: "test-rule",
    ruleName: "Test Rule",
    passed: true,
    severity: Severity.INFO,
    score: 0,
    computedValue: 0,
    threshold: 0,
    approvalRequired: false,
    approvalLevel: ApprovalLevel.AUTO_APPROVE,
    message: "",
    metadata: {},
    executionTimeMs: 0,
    ...overrides,
  };
}

describe("BlendedRiskRule", () => {
  it("computes low risk for Gold customer with small order and no failures", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "GOLD" }),
      blendedDiscountPct: 0.02,
      quotation: mockQuotation({ grandTotal: 5000 }),
      discountPolicies: [mockDiscountPolicy({ tier: "GOLD", value: 0.20 })],
      categories: ["Hardware"],
    });

    const result = await rule.evaluate(ctx, []);

    expect(result.score).toBeLessThan(30);
    expect(result.passed).toBe(true);
    expect(result.severity).toBe("INFO");
  });

  it("computes high risk for Bronze customer with large order and failures", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "BRONZE" }),
      blendedDiscountPct: 0.15,
      quotation: mockQuotation({ grandTotal: 150000 }),
      discountPolicies: [mockDiscountPolicy({ value: 0.05 })],
      categories: ["Hardware", "Software", "Services", "Consulting", "Support"],
    });

    const priorResults = [
      makePriorResult({ passed: false, severity: Severity.CRITICAL }),
      makePriorResult({ ruleId: "r2", passed: false, severity: Severity.WARNING }),
      makePriorResult({ ruleId: "r3", passed: true, severity: Severity.WARNING }),
    ];

    const result = await rule.evaluate(ctx, priorResults);

    expect(result.score).toBeGreaterThan(70);
    expect(result.severity).toBe("CRITICAL");
  });

  it("returns score exactly 0-100 (clamped)", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "GOLD" }),
      blendedDiscountPct: 0,
      quotation: mockQuotation({ grandTotal: 100 }),
      discountPolicies: [mockDiscountPolicy({ tier: "GOLD", value: 0.20 })],
      categories: [],
    });

    const result = await rule.evaluate(ctx, []);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("increases risk with more category diversity", async () => {
    const ctxSingle = mockContext({
      customer: mockCustomer({ tier: "SILVER" }),
      blendedDiscountPct: 0.05,
      quotation: mockQuotation({ grandTotal: 50000 }),
      categories: ["Hardware"],
    });

    const ctxMulti = mockContext({
      customer: mockCustomer({ tier: "SILVER" }),
      blendedDiscountPct: 0.05,
      quotation: mockQuotation({ grandTotal: 50000 }),
      categories: ["Hardware", "Software", "Services", "Support"],
    });

    const singleResult = await rule.evaluate(ctxSingle, []);
    const multiResult = await rule.evaluate(ctxMulti, []);

    expect(multiResult.score).toBeGreaterThan(singleResult.score);
  });

  it("treats missing prior results as empty array", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "SILVER" }),
      blendedDiscountPct: 0.05,
    });

    // No prior results argument
    const result = await rule.evaluate(ctx);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.ruleId).toBe("blended-risk");
  });

  it("factors in failed rule count heavily (25% weight)", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "SILVER" }),
      blendedDiscountPct: 0.05,
      quotation: mockQuotation({ grandTotal: 50000 }),
    });

    const noFails: RuleResult[] = [
      makePriorResult({ passed: true }),
      makePriorResult({ ruleId: "r2", passed: true }),
    ];

    const withFails: RuleResult[] = [
      makePriorResult({ passed: false }),
      makePriorResult({ ruleId: "r2", passed: false }),
    ];

    const resultNoFails = await rule.evaluate(ctx, noFails);
    const resultWithFails = await rule.evaluate(ctx, withFails);

    expect(resultWithFails.score).toBeGreaterThan(resultNoFails.score);
  });
});
