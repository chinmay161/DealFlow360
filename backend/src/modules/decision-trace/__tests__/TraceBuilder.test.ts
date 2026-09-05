/**
 * TraceBuilder — Unit Tests
 *
 * Tests for all pure functions in TraceBuilder.
 * No database dependency — uses mock evaluation records.
 */

import { describe, it, expect } from "vitest";
import {
  buildRuleEntries,
  buildOverallDecision,
  buildOverallRiskScore,
  buildApprovalLevel,
  buildSummary,
  buildDecisionTree,
  buildTimeline,
  buildStatistics,
  filterEntries,
} from "../services/TraceBuilder.js";
import {
  mockEvaluationSet,
  mockAllPassingSet,
  mockEvaluation,
} from "./helpers.js";

// ─── buildRuleEntries ────────────────────────────────────────────────────────

describe("buildRuleEntries", () => {
  it("converts raw evaluations to structured rule entries", () => {
    const evaluations = mockEvaluationSet();
    const entries = buildRuleEntries(evaluations);

    expect(entries).toHaveLength(6);
    expect(entries[0].ruleName).toBe("Customer Tier Rule");
    expect(entries[0].ruleId).toBe("customer-tier");
    expect(entries[0].status).toBe("PASS");
    expect(entries[0].severity).toBe("LOW"); // INFO → LOW
  });

  it("maps severity correctly", () => {
    const evaluations = mockEvaluationSet();
    const entries = buildRuleEntries(evaluations);

    // Customer Tier (INFO) → LOW
    expect(entries[0].severity).toBe("LOW");
    // Discount Ceiling (WARNING) → MEDIUM
    expect(entries[1].severity).toBe("MEDIUM");
  });

  it("preserves explanation text", () => {
    const evaluations = mockEvaluationSet();
    const entries = buildRuleEntries(evaluations);

    expect(entries[1].explanation).toBe(
      "Line SKU-001 has 18.2% discount, exceeding the 10.0% ceiling",
    );
  });

  it("extracts metadata into inputs", () => {
    const evaluations = mockEvaluationSet();
    const entries = buildRuleEntries(evaluations);

    // Customer Tier Rule has metadata with customerTier
    expect(entries[0].inputs).toEqual({
      customerTier: "BRONZE",
      allowedDiscount: 0.10,
    });
  });

  it("handles empty evaluations array", () => {
    const entries = buildRuleEntries([]);
    expect(entries).toEqual([]);
  });
});

// ─── buildOverallDecision ────────────────────────────────────────────────────

describe("buildOverallDecision", () => {
  it("returns routing rule explanation when present", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const decision = buildOverallDecision(entries);

    expect(decision).toBe(
      "Finance approval required (2 failed rule(s), risk score 82.0).",
    );
  });

  it("returns generic message when routing rule not present", () => {
    const evaluations = [mockEvaluation({ outcome: "FAIL" })];
    const entries = buildRuleEntries(evaluations);
    const decision = buildOverallDecision(entries);

    expect(decision).toContain("failed");
  });

  it("returns auto-approve message when all pass", () => {
    const entries = buildRuleEntries(mockAllPassingSet());
    const decision = buildOverallDecision(entries);

    expect(decision).toContain("auto-approved");
  });
});

// ─── buildOverallRiskScore ───────────────────────────────────────────────────

describe("buildOverallRiskScore", () => {
  it("extracts risk score from blended-risk entry", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const score = buildOverallRiskScore(entries);

    expect(score).toBe(82);
  });

  it("returns 0 when no blended-risk entry exists", () => {
    const entries = buildRuleEntries([mockEvaluation()]);
    const score = buildOverallRiskScore(entries);

    expect(score).toBe(0);
  });
});

// ─── buildApprovalLevel ──────────────────────────────────────────────────────

describe("buildApprovalLevel", () => {
  it("extracts finalLevel from approval-routing metadata", () => {
    const evaluations = mockEvaluationSet();
    const level = buildApprovalLevel(evaluations);

    expect(level).toBe("FINANCE");
  });

  it("returns AUTO_APPROVE when no routing rule exists", () => {
    const evaluations = [mockEvaluation()];
    const level = buildApprovalLevel(evaluations);

    expect(level).toBe("AUTO_APPROVE");
  });
});

// ─── buildSummary ────────────────────────────────────────────────────────────

describe("buildSummary", () => {
  it("generates summary with bullet points for failed/warned rules", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const summary = buildSummary(entries, "FINANCE");

    expect(summary).toContain("Finance approval required because");
    expect(summary).toContain("- Line SKU-001 has 18");
    expect(summary).toContain("- Blended margin 22");
    expect(summary).toContain("- Blended risk score 82");
    expect(summary).toContain("3 rules triggered.");
  });

  it("returns clean message when all pass", () => {
    const entries = buildRuleEntries(mockAllPassingSet());
    const summary = buildSummary(entries, "AUTO_APPROVE");

    expect(summary).toBe("All rules passed. No issues detected.");
  });

  it("adjusts header based on approval level", () => {
    const entries = buildRuleEntries(mockEvaluationSet());

    expect(buildSummary(entries, "MANAGER")).toContain("Manager approval required");
    expect(buildSummary(entries, "EXECUTIVE")).toContain("Executive approval required");
    expect(buildSummary(entries, "REJECT")).toContain("Quotation rejected");
  });
});

// ─── buildDecisionTree ───────────────────────────────────────────────────────

describe("buildDecisionTree", () => {
  it("builds linked-list tree in execution order", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const tree = buildDecisionTree(entries);

    expect(tree).toHaveLength(6);
    expect(tree[0].ruleName).toBe("Customer Tier Rule");
    expect(tree[0].status).toBe("PASS");
    expect(tree[0].next?.ruleName).toBe("Discount Ceiling Rule");
    expect(tree[4].next?.ruleName).toBe("Approval Routing Rule");
    expect(tree[5].next).toBeNull();
  });

  it("returns empty array for no entries", () => {
    expect(buildDecisionTree([])).toEqual([]);
  });
});

// ─── buildTimeline ───────────────────────────────────────────────────────────

describe("buildTimeline", () => {
  it("builds timeline with formatted timestamps", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const timeline = buildTimeline(entries);

    expect(timeline).toHaveLength(6);
    expect(timeline[0].ruleName).toBe("Customer Tier Rule");
    expect(timeline[0].outcome).toBe("PASS");
    // Time format depends on locale, just check it's a non-empty string
    expect(timeline[0].time.length).toBeGreaterThan(0);
  });
});

// ─── buildStatistics ─────────────────────────────────────────────────────────

describe("buildStatistics", () => {
  it("computes correct counts", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const stats = buildStatistics(entries, 18);

    expect(stats.rulesEvaluated).toBe(6);
    expect(stats.passed).toBe(3); // Customer Tier, Category Discount, Approval Routing
    expect(stats.failed).toBe(2); // Discount Ceiling, Margin
    expect(stats.warnings).toBe(1); // Blended Risk
    expect(stats.executionTimeMs).toBe(18);
  });

  it("handles empty entries", () => {
    const stats = buildStatistics([], 0);

    expect(stats.rulesEvaluated).toBe(0);
    expect(stats.passed).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.warnings).toBe(0);
  });
});

// ─── filterEntries ───────────────────────────────────────────────────────────

describe("filterEntries", () => {
  it("filters by passed=true", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const filtered = filterEntries(entries, { passed: true });

    expect(filtered.every((e) => e.status === "PASS")).toBe(true);
    expect(filtered).toHaveLength(3);
  });

  it("filters by failed=true", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const filtered = filterEntries(entries, { failed: true });

    expect(filtered.every((e) => e.status === "FAIL")).toBe(true);
    expect(filtered).toHaveLength(2);
  });

  it("filters by severity", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const filtered = filterEntries(entries, { severity: "MEDIUM" });

    expect(filtered.every((e) => e.severity === "MEDIUM")).toBe(true);
  });

  it("filters by rule name (partial match)", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const filtered = filterEntries(entries, { rule: "Ceiling" });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].ruleName).toBe("Discount Ceiling Rule");
  });

  it("filters by rule name (case-insensitive)", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const filtered = filterEntries(entries, { rule: "discount" });

    // Matches both "Discount Ceiling Rule" and "Category Discount Rule"
    expect(filtered).toHaveLength(2);
  });

  it("returns all entries when no filters applied", () => {
    const entries = buildRuleEntries(mockEvaluationSet());
    const filtered = filterEntries(entries, {});

    expect(filtered).toHaveLength(6);
  });
});
