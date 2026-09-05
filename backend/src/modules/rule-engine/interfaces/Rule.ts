/**
 * Rule Engine — Core Interfaces & Types
 *
 * Every business rule implements the `Rule` interface. The engine only
 * depends on this contract, making it trivial to add new rules.
 */

import type { RuleContext } from "../engine/RuleContext.js";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Severity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

export enum ApprovalLevel {
  AUTO_APPROVE = "AUTO_APPROVE",
  MANAGER = "MANAGER",
  FINANCE = "FINANCE",
  EXECUTIVE = "EXECUTIVE",
  REJECT = "REJECT",
}

// ─── Rule Result ─────────────────────────────────────────────────────────────

export interface RuleResult {
  /** Unique identifier matching the rule that produced this result. */
  ruleId: string;
  /** Human-readable rule name. */
  ruleName: string;
  /** Whether the quotation passed this rule. */
  passed: boolean;
  /** Severity of the finding. */
  severity: Severity;
  /** Numeric score (0–100) representing rule-specific risk contribution. */
  score: number;
  /** The actual computed value (e.g. effective discount %). */
  computedValue: number;
  /** The threshold against which computedValue was compared. */
  threshold: number;
  /** Whether this result requires manual approval. */
  approvalRequired: boolean;
  /** The approval level required (only meaningful when approvalRequired is true). */
  approvalLevel: ApprovalLevel;
  /** Human-readable explanation of the outcome. */
  message: string;
  /** Arbitrary metadata the rule may attach. */
  metadata: Record<string, unknown>;
  /** Wall-clock execution time in milliseconds. */
  executionTimeMs: number;
}

// ─── Recommendation ──────────────────────────────────────────────────────────

export interface Recommendation {
  ruleId: string;
  ruleName: string;
  currentValue: number;
  requiredValue: number;
  message: string;
}

// ─── Aggregate Engine Result ─────────────────────────────────────────────────

export interface RuleEngineResult {
  /** Overall pass/fail. */
  approved: boolean;
  /** Highest approval level required across all rules. */
  approvalLevel: ApprovalLevel;
  /** Blended risk score (0–100). */
  overallRiskScore: number;
  /** Human-readable decision summary. */
  decision: string;
  /** Rules that were triggered (passed = false OR approvalRequired = true). */
  triggeredRules: RuleResult[];
  /** Rules that explicitly failed. */
  failedRules: RuleResult[];
  /** Rules that passed but emitted warnings. */
  warnings: RuleResult[];
  /** Full ordered trace of every rule evaluation. */
  trace: RuleResult[];
  /** Counterfactual recommendations to achieve compliance. */
  recommendations: Recommendation[];
}

// ─── Rule Interface ──────────────────────────────────────────────────────────

export interface Rule {
  /** Stable identifier (e.g. "discount-ceiling"). Used as DB key. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** Short description of what the rule checks. */
  readonly description: string;

  /**
   * Evaluate the rule against the provided context.
   *
   * Rules receive a **read-only** context and must not mutate it.
   * The optional `priorResults` parameter is only used by aggregate rules
   * (e.g. ApprovalRoutingRule) that need to inspect earlier outcomes.
   */
  evaluate(context: RuleContext, priorResults?: RuleResult[]): Promise<RuleResult>;
}
