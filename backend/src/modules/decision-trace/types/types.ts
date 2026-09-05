/**
 * Decision Trace — Core Types
 *
 * Internal types used throughout the decision-trace module.
 * These represent the shape of data as read from the database,
 * before any formatting or transformation.
 */

// ─── RuleEvaluation DB Record ────────────────────────────────────────────────

/**
 * Normalised representation of a Prisma RuleEvaluation row.
 * Decimal fields are converted to `number` at read time.
 *
 * The `inputs` field is typed as `unknown` because Prisma's Json
 * column is opaque. TraceBuilder.parseInputs() safely extracts
 * the structured RuleEvaluationInputs shape at runtime.
 */
export interface RuleEvaluationRecord {
  id: string;
  ruleName: string;
  inputs: unknown;
  computedValue: number;
  threshold: number;
  outcome: RuleOutcome;
  explanation: string | null;
  evaluatedAt: Date;
  createdAt: Date;
  quotationId: string;
  ruleId: string | null;
}

/**
 * Shape of the JSON stored in RuleEvaluation.inputs by
 * RuleEvaluationService.persist(). This is the contract between
 * the rule engine's persistence layer and the decision-trace reader.
 */
export interface RuleEvaluationInputs {
  ruleId: string;
  computedValue: number;
  threshold: number;
  severity: string;
  approvalLevel: string;
  metadata: Record<string, unknown>;
}

// ─── Enums / Discriminators ──────────────────────────────────────────────────

/** Mirrors the Prisma RuleOutcome enum. */
export type RuleOutcome = "PASS" | "FAIL" | "WARN" | "SKIP";

/**
 * Severity levels exposed in the Decision Trace API.
 * Mapped from the rule engine's Severity enum (INFO → LOW,
 * WARNING → MEDIUM, CRITICAL → HIGH / CRITICAL).
 */
export type RuleSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Discriminator for the formatting mode. */
export type TraceFormat = "raw" | "human";

/** Supported export formats. */
export type ExportFormat = "json" | "csv";
