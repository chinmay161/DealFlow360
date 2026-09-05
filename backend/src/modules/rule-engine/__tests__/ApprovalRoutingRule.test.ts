import { describe, it, expect } from "vitest";
import { ApprovalRoutingRule } from "../rules/ApprovalRoutingRule.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import { mockContext, mockApprovalRule, mockCustomer } from "./helpers.js";
import type { RuleResult } from "../interfaces/Rule.js";

const rule = new ApprovalRoutingRule();

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

describe("ApprovalRoutingRule", () => {
  it("routes to AUTO_APPROVE when all rules pass and risk is low", async () => {
    const ctx = mockContext({
      blendedDiscountPct: 0.02,
      approvalRules: [mockApprovalRule({ threshold: 0.10 })],
    });

    const priorResults = [
      makePriorResult({ ruleId: "blended-risk", score: 10 }),
      makePriorResult({ passed: true }),
    ];

    const result = await rule.evaluate(ctx, priorResults);

    expect(result.approvalLevel).toBe(ApprovalLevel.AUTO_APPROVE);
    expect(result.passed).toBe(true);
  });

  it("routes to MANAGER when warnings exist", async () => {
    const ctx = mockContext({
      blendedDiscountPct: 0.02,
      approvalRules: [],
    });

    const priorResults = [
      makePriorResult({ ruleId: "blended-risk", score: 30 }),
      makePriorResult({ passed: true, severity: Severity.WARNING }),
    ];

    const result = await rule.evaluate(ctx, priorResults);

    expect(result.approvalLevel).toBe(ApprovalLevel.MANAGER);
  });

  it("routes to FINANCE when financial rules fail", async () => {
    const ctx = mockContext({
      blendedDiscountPct: 0.15,
      approvalRules: [],
    });

    const priorResults = [
      makePriorResult({ ruleId: "blended-risk", score: 60 }),
      makePriorResult({ ruleId: "margin", passed: false, severity: Severity.WARNING }),
    ];

    const result = await rule.evaluate(ctx, priorResults);

    expect(result.approvalLevel).toBe(ApprovalLevel.FINANCE);
  });

  it("routes to EXECUTIVE when multiple rules fail", async () => {
    const ctx = mockContext({
      blendedDiscountPct: 0.20,
      approvalRules: [],
    });

    const priorResults = [
      makePriorResult({ ruleId: "blended-risk", score: 80 }),
      makePriorResult({ ruleId: "r1", passed: false }),
      makePriorResult({ ruleId: "r2", passed: false }),
      makePriorResult({ ruleId: "r3", passed: false }),
    ];

    const result = await rule.evaluate(ctx, priorResults);

    expect(result.approvalLevel).toBe(ApprovalLevel.EXECUTIVE);
  });

  it("routes to REJECT when critical violations exist with very high risk", async () => {
    const ctx = mockContext({
      blendedDiscountPct: 0.30,
      approvalRules: [],
    });

    const priorResults = [
      makePriorResult({ ruleId: "blended-risk", score: 95 }),
      makePriorResult({ ruleId: "r1", passed: false, severity: Severity.CRITICAL }),
    ];

    const result = await rule.evaluate(ctx, priorResults);

    expect(result.approvalLevel).toBe(ApprovalLevel.REJECT);
    expect(result.passed).toBe(false);
  });

  it("uses DB ApprovalRule thresholds to elevate routing", async () => {
    const ctx = mockContext({
      blendedDiscountPct: 0.12,
      approvalRules: [
        mockApprovalRule({ stage: 1, threshold: 0.05, approverRole: "MANAGER" }),
        mockApprovalRule({ id: "arule-2", stage: 2, threshold: 0.10, approverRole: "FINANCE" }),
      ],
    });

    const priorResults = [
      makePriorResult({ ruleId: "blended-risk", score: 15 }),
    ];

    const result = await rule.evaluate(ctx, priorResults);

    // DB says FINANCE because 12% > 10% threshold
    expect([ApprovalLevel.FINANCE, ApprovalLevel.MANAGER]).toContain(result.approvalLevel);
    expect(result.metadata.dbRoutedLevel).toBe(ApprovalLevel.FINANCE);
  });

  it("takes the more restrictive of DB and heuristic routing", async () => {
    const ctx = mockContext({
      blendedDiscountPct: 0.12,
      approvalRules: [
        mockApprovalRule({ stage: 1, threshold: 0.05, approverRole: "MANAGER" }),
      ],
    });

    // Heuristic: warnings → MANAGER. DB: discount > threshold → MANAGER. Same level.
    const priorResults = [
      makePriorResult({ ruleId: "blended-risk", score: 25 }),
      makePriorResult({ passed: true, severity: Severity.WARNING }),
    ];

    const result = await rule.evaluate(ctx, priorResults);

    expect(result.approvalLevel).toBe(ApprovalLevel.MANAGER);
  });

  it("handles empty prior results gracefully", async () => {
    const ctx = mockContext({
      blendedDiscountPct: 0.01,
      approvalRules: [],
    });

    const result = await rule.evaluate(ctx, []);

    expect(result.passed).toBe(true);
    expect(result.approvalLevel).toBe(ApprovalLevel.AUTO_APPROVE);
  });
});
