/**
 * Decision Trace — Test Helpers
 *
 * Mock factories for RuleEvaluation records matching the shape
 * persisted by RuleEvaluationService.persist().
 */

import type { RuleEvaluationRecord, RuleEvaluationInputs } from "../types/types.js";

// ─── Default Evaluation Time ─────────────────────────────────────────────────

const BASE_TIME = new Date("2024-06-15T11:03:15.000Z");

function offsetTime(ms: number): Date {
  return new Date(BASE_TIME.getTime() + ms);
}

// ─── Input Factory ───────────────────────────────────────────────────────────

export function mockInputs(
  overrides: Partial<RuleEvaluationInputs> = {},
): RuleEvaluationInputs {
  return {
    ruleId: "discount-ceiling",
    computedValue: 0.1823,
    threshold: 0.10,
    severity: "WARNING",
    approvalLevel: "MANAGER",
    metadata: {},
    ...overrides,
  };
}

// ─── Evaluation Record Factory ───────────────────────────────────────────────

export function mockEvaluation(
  overrides: Partial<RuleEvaluationRecord> = {},
): RuleEvaluationRecord {
  return {
    id: "eval-1",
    ruleName: "Discount Ceiling Rule",
    inputs: mockInputs(),
    computedValue: 0.1823,
    threshold: 0.10,
    outcome: "FAIL",
    explanation: "Line SKU-001 has 18.2% discount, exceeding the 10.0% ceiling",
    evaluatedAt: BASE_TIME,
    createdAt: BASE_TIME,
    quotationId: "quot-1",
    ruleId: null,
    ...overrides,
  };
}

// ─── Pre-built Evaluation Sets ───────────────────────────────────────────────

/**
 * A complete set of evaluations mimicking a typical rule engine run
 * with mixed outcomes.
 */
export function mockEvaluationSet(): RuleEvaluationRecord[] {
  return [
    mockEvaluation({
      id: "eval-1",
      ruleName: "Customer Tier Rule",
      inputs: mockInputs({
        ruleId: "customer-tier",
        computedValue: 0.05,
        threshold: 0.10,
        severity: "INFO",
        approvalLevel: "AUTO_APPROVE",
        metadata: { customerTier: "BRONZE", allowedDiscount: 0.10 },
      }),
      computedValue: 0.05,
      threshold: 0.10,
      outcome: "PASS",
      explanation: "Customer tier Bronze allows up to 10.0% discount",
      evaluatedAt: offsetTime(0),
    }),
    mockEvaluation({
      id: "eval-2",
      ruleName: "Discount Ceiling Rule",
      inputs: mockInputs({
        ruleId: "discount-ceiling",
        computedValue: 0.1823,
        threshold: 0.10,
        severity: "WARNING",
        approvalLevel: "MANAGER",
        metadata: {
          maxDiscountPct: 0.1823,
          ceiling: 0.10,
          offendingLineSku: "SKU-001",
        },
      }),
      computedValue: 0.1823,
      threshold: 0.10,
      outcome: "FAIL",
      explanation: "Line SKU-001 has 18.2% discount, exceeding the 10.0% ceiling",
      evaluatedAt: offsetTime(10),
    }),
    mockEvaluation({
      id: "eval-3",
      ruleName: "Margin Rule",
      inputs: mockInputs({
        ruleId: "margin",
        computedValue: 0.22,
        threshold: 0.25,
        severity: "WARNING",
        approvalLevel: "FINANCE",
        metadata: {},
      }),
      computedValue: 0.22,
      threshold: 0.25,
      outcome: "FAIL",
      explanation: "Blended margin 22.0% is below the 25.0% threshold",
      evaluatedAt: offsetTime(20),
    }),
    mockEvaluation({
      id: "eval-4",
      ruleName: "Blended Risk Rule",
      inputs: mockInputs({
        ruleId: "blended-risk",
        computedValue: 82,
        threshold: 75,
        severity: "WARNING",
        approvalLevel: "FINANCE",
        metadata: { riskBreakdown: { discount: 40, margin: 20, volume: 22 } },
      }),
      computedValue: 82,
      threshold: 75,
      outcome: "WARN",
      explanation: "Blended risk score 82.0 exceeds the 75.0 threshold",
      evaluatedAt: offsetTime(30),
    }),
    mockEvaluation({
      id: "eval-5",
      ruleName: "Category Discount Rule",
      inputs: mockInputs({
        ruleId: "category-discount",
        computedValue: 0.08,
        threshold: 0.15,
        severity: "INFO",
        approvalLevel: "AUTO_APPROVE",
        metadata: {},
      }),
      computedValue: 0.08,
      threshold: 0.15,
      outcome: "PASS",
      explanation: "Category discount 8.0% is within the 15.0% limit",
      evaluatedAt: offsetTime(40),
    }),
    mockEvaluation({
      id: "eval-6",
      ruleName: "Approval Routing Rule",
      inputs: mockInputs({
        ruleId: "approval-routing",
        computedValue: 82,
        threshold: 75,
        severity: "WARNING",
        approvalLevel: "FINANCE",
        metadata: {
          dbRoutedLevel: "MANAGER",
          heuristicLevel: "FINANCE",
          finalLevel: "FINANCE",
          failedCount: 2,
          criticalCount: 0,
          warningCount: 1,
          riskScore: 82,
        },
      }),
      computedValue: 82,
      threshold: 75,
      outcome: "PASS",
      explanation: "Finance approval required (2 failed rule(s), risk score 82.0).",
      evaluatedAt: offsetTime(50),
    }),
  ];
}

/**
 * An all-passing evaluation set.
 */
export function mockAllPassingSet(): RuleEvaluationRecord[] {
  return [
    mockEvaluation({
      id: "eval-p1",
      ruleName: "Discount Ceiling Rule",
      inputs: mockInputs({
        ruleId: "discount-ceiling",
        severity: "INFO",
        approvalLevel: "AUTO_APPROVE",
        computedValue: 0.05,
        threshold: 0.10,
      }),
      computedValue: 0.05,
      threshold: 0.10,
      outcome: "PASS",
      explanation: "All line discounts within ceiling",
      evaluatedAt: offsetTime(0),
    }),
    mockEvaluation({
      id: "eval-p2",
      ruleName: "Approval Routing Rule",
      inputs: mockInputs({
        ruleId: "approval-routing",
        severity: "INFO",
        approvalLevel: "AUTO_APPROVE",
        computedValue: 0,
        threshold: 75,
        metadata: { finalLevel: "AUTO_APPROVE" },
      }),
      computedValue: 0,
      threshold: 75,
      outcome: "PASS",
      explanation: "All checks passed. Quotation can be auto-approved.",
      evaluatedAt: offsetTime(10),
    }),
  ];
}
