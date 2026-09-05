import { describe, it, expect, beforeEach } from "vitest";
import { RuleExecutor } from "../engine/RuleExecutor.js";
import { RuleRegistry } from "../engine/RuleRegistry.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import type { Rule, RuleResult } from "../interfaces/Rule.js";
import type { RuleContext } from "../engine/RuleContext.js";
import { mockContext } from "./helpers.js";

// ─── Stub rules for testing the engine plumbing ──────────────────────────────

class PassingRule implements Rule {
  readonly id = "stub-pass";
  readonly name = "Stub Pass";
  readonly description = "Always passes";
  async evaluate(): Promise<RuleResult> {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      severity: Severity.INFO,
      score: 0,
      computedValue: 0,
      threshold: 0,
      approvalRequired: false,
      approvalLevel: ApprovalLevel.AUTO_APPROVE,
      message: "OK",
      metadata: {},
      executionTimeMs: 0,
    };
  }
}

class FailingRule implements Rule {
  readonly id = "stub-fail";
  readonly name = "Stub Fail";
  readonly description = "Always fails";
  async evaluate(): Promise<RuleResult> {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: false,
      severity: Severity.WARNING,
      score: 50,
      computedValue: 0.20,
      threshold: 0.10,
      approvalRequired: true,
      approvalLevel: ApprovalLevel.MANAGER,
      message: "Failed",
      metadata: {},
      executionTimeMs: 0,
    };
  }
}

class ThrowingRule implements Rule {
  readonly id = "stub-throw";
  readonly name = "Stub Throw";
  readonly description = "Throws an error";
  async evaluate(): Promise<RuleResult> {
    throw new Error("Simulated explosion");
  }
}

describe("RuleExecutor", () => {
  const executor = new RuleExecutor();

  it("executes all rules and returns ordered results", async () => {
    const rules: Rule[] = [new PassingRule(), new FailingRule()];
    const ctx = mockContext();

    const results = await executor.execute(rules, ctx);

    expect(results).toHaveLength(2);
    expect(results[0].ruleId).toBe("stub-pass");
    expect(results[0].passed).toBe(true);
    expect(results[1].ruleId).toBe("stub-fail");
    expect(results[1].passed).toBe(false);
  });

  it("isolates errors — throwing rule does not crash others", async () => {
    const rules: Rule[] = [new PassingRule(), new ThrowingRule(), new FailingRule()];
    const ctx = mockContext();

    const results = await executor.execute(rules, ctx);

    expect(results).toHaveLength(3);
    expect(results[0].passed).toBe(true); // PassingRule
    expect(results[1].passed).toBe(false); // ThrowingRule → error
    expect(results[1].severity).toBe("CRITICAL");
    expect(results[1].message).toContain("Simulated explosion");
    expect(results[2].passed).toBe(false); // FailingRule
  });

  it("measures execution time", async () => {
    const rules: Rule[] = [new PassingRule()];
    const ctx = mockContext();

    const results = await executor.execute(rules, ctx);

    expect(results[0].executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});

describe("RuleRegistry", () => {
  let registry: RuleRegistry;

  beforeEach(() => {
    // Get the singleton and clear it for test isolation
    registry = RuleRegistry.getInstance();
    registry.clear();
  });

  it("registers and retrieves rules", () => {
    const rule = new PassingRule();
    registry.register(rule);

    expect(registry.size).toBe(1);
    expect(registry.get("stub-pass")).toBe(rule);
    expect(registry.getAll()).toHaveLength(1);
  });

  it("ignores duplicate registrations", () => {
    registry.register(new PassingRule());
    registry.register(new PassingRule()); // same ID

    expect(registry.size).toBe(1);
  });

  it("clears all rules", () => {
    registry.register(new PassingRule());
    registry.register(new FailingRule());
    registry.clear();

    expect(registry.size).toBe(0);
    expect(registry.getAll()).toHaveLength(0);
  });

  it("returns undefined for unknown rule", () => {
    expect(registry.get("nonexistent")).toBeUndefined();
  });
});
