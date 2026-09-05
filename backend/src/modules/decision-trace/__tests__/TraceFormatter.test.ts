/**
 * TraceFormatter — Unit Tests
 *
 * Tests for value formatting functions.
 */

import { describe, it, expect } from "vitest";
import {
  formatPercentage,
  formatCurrency,
  formatDecimal,
  formatRuleEntry,
  formatTrace,
} from "../services/TraceFormatter.js";
import type { DecisionTraceRuleEntry, DecisionTraceResponse } from "../interfaces/interfaces.js";

// ─── formatPercentage ────────────────────────────────────────────────────────

describe("formatPercentage", () => {
  it("converts decimal fraction to percentage string", () => {
    expect(formatPercentage(0.1823)).toBe("18.23%");
  });

  it("handles zero", () => {
    expect(formatPercentage(0)).toBe("0.00%");
  });

  it("handles 1.0 as 100%", () => {
    expect(formatPercentage(1)).toBe("100.00%");
  });

  it("handles small values", () => {
    expect(formatPercentage(0.001)).toBe("0.10%");
  });

  it("handles values greater than 1", () => {
    expect(formatPercentage(1.5)).toBe("150.00%");
  });
});

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats INR currency", () => {
    const result = formatCurrency(1500.25, "INR");
    // Intl formatting varies by env but should contain the amount
    expect(result).toContain("1,500.25");
  });

  it("formats USD currency", () => {
    const result = formatCurrency(1500.25, "USD");
    expect(result).toContain("1,500.25");
  });

  it("handles zero", () => {
    const result = formatCurrency(0, "USD");
    expect(result).toContain("0.00");
  });

  it("handles large values", () => {
    const result = formatCurrency(1000000.50, "INR");
    expect(result).toContain("00");
  });

  it("falls back gracefully for unknown currency codes", () => {
    const result = formatCurrency(100, "XYZ");
    // Should use USD fallback
    expect(result).toBeTruthy();
  });
});

// ─── formatDecimal ───────────────────────────────────────────────────────────

describe("formatDecimal", () => {
  it("formats to 2 decimal places by default", () => {
    expect(formatDecimal(3.14159)).toBe("3.14");
  });

  it("supports custom precision", () => {
    expect(formatDecimal(3.14159, 4)).toBe("3.1416");
  });

  it("pads with zeros", () => {
    expect(formatDecimal(5, 2)).toBe("5.00");
  });
});

// ─── formatRuleEntry ─────────────────────────────────────────────────────────

describe("formatRuleEntry", () => {
  const baseEntry: DecisionTraceRuleEntry = {
    ruleId: "discount-ceiling",
    ruleName: "Discount Ceiling Rule",
    status: "FAIL",
    severity: "MEDIUM",
    inputs: {},
    computedValue: 0.1823,
    threshold: 0.10,
    outcome: "FAIL",
    explanation: "Exceeded ceiling",
    evaluatedAt: "2024-06-15T11:03:15.000Z",
  };

  it("formats percentage rules with % symbol", () => {
    const formatted = formatRuleEntry(baseEntry, "INR");

    expect(formatted.computedValue).toBe("18.23%");
    expect(formatted.threshold).toBe("10.00%");
  });

  it("leaves non-percentage, non-currency rules unchanged", () => {
    const approvalEntry: DecisionTraceRuleEntry = {
      ...baseEntry,
      ruleId: "approval-routing",
      computedValue: 82,
      threshold: 75,
    };

    const formatted = formatRuleEntry(approvalEntry, "INR");

    expect(formatted.computedValue).toBe(82);
    expect(formatted.threshold).toBe(75);
  });

  it("formats margin rule as percentage", () => {
    const marginEntry: DecisionTraceRuleEntry = {
      ...baseEntry,
      ruleId: "margin",
      computedValue: 0.22,
      threshold: 0.25,
    };

    const formatted = formatRuleEntry(marginEntry, "INR");

    expect(formatted.computedValue).toBe("22.00%");
    expect(formatted.threshold).toBe("25.00%");
  });
});

// ─── formatTrace ─────────────────────────────────────────────────────────────

describe("formatTrace", () => {
  it("formats all rule entries in the response", () => {
    const response: DecisionTraceResponse = {
      quotationId: "quot-1",
      overallDecision: "Finance approval required",
      overallRiskScore: 82,
      approvalLevel: "FINANCE",
      summary: "Summary text",
      rules: [
        {
          ruleId: "discount-ceiling",
          ruleName: "Discount Ceiling Rule",
          status: "FAIL",
          severity: "MEDIUM",
          inputs: {},
          computedValue: 0.1823,
          threshold: 0.10,
          outcome: "FAIL",
          explanation: "Exceeded ceiling",
          evaluatedAt: "2024-06-15T11:03:15.000Z",
        },
        {
          ruleId: "approval-routing",
          ruleName: "Approval Routing Rule",
          status: "PASS",
          severity: "MEDIUM",
          inputs: {},
          computedValue: 82,
          threshold: 75,
          outcome: "PASS",
          explanation: "Finance approval required",
          evaluatedAt: "2024-06-15T11:03:15.050Z",
        },
      ],
      decisionTree: [],
      timeline: [],
      statistics: {
        rulesEvaluated: 2,
        passed: 1,
        failed: 1,
        warnings: 0,
        executionTimeMs: 10,
      },
    };

    const formatted = formatTrace(response, "INR");

    // Discount ceiling should be formatted as %
    expect(formatted.rules[0].computedValue).toBe("18.23%");
    // Approval routing should remain numeric
    expect(formatted.rules[1].computedValue).toBe(82);
    // Other fields should be preserved
    expect(formatted.quotationId).toBe("quot-1");
    expect(formatted.overallRiskScore).toBe(82);
  });

  it("does not mutate the original response", () => {
    const response: DecisionTraceResponse = {
      quotationId: "quot-1",
      overallDecision: "Test",
      overallRiskScore: 0,
      approvalLevel: "AUTO_APPROVE",
      summary: "All good",
      rules: [
        {
          ruleId: "discount-ceiling",
          ruleName: "Discount Ceiling Rule",
          status: "PASS",
          severity: "LOW",
          inputs: {},
          computedValue: 0.05,
          threshold: 0.10,
          outcome: "PASS",
          explanation: null,
          evaluatedAt: "2024-06-15T11:03:15.000Z",
        },
      ],
      decisionTree: [],
      timeline: [],
      statistics: {
        rulesEvaluated: 1,
        passed: 1,
        failed: 0,
        warnings: 0,
        executionTimeMs: 5,
      },
    };

    formatTrace(response, "INR");

    // Original should still be a number
    expect(typeof response.rules[0].computedValue).toBe("number");
  });
});
