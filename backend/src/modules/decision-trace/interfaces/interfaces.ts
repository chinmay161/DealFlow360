/**
 * Decision Trace — Public Interfaces
 *
 * These interfaces define the shape of API responses and internal
 * contracts. The frontend consumes these directly — it should never
 * reconstruct or infer explanations on its own.
 */

// ─── Top-Level API Response ──────────────────────────────────────────────────

export interface DecisionTraceResponse {
  quotationId: string;
  overallDecision: string;
  overallRiskScore: number;
  approvalLevel: string;
  summary: string;
  rules: DecisionTraceRuleEntry[];
  decisionTree: DecisionTreeNode[];
  timeline: TimelineEntry[];
  statistics: TraceStatistics;
}

// ─── Per-Rule Entry ──────────────────────────────────────────────────────────

export interface DecisionTraceRuleEntry {
  ruleId: string;
  ruleName: string;
  status: string;
  severity: string;
  inputs: Record<string, unknown>;
  computedValue: number | string;
  threshold: number | string;
  outcome: string;
  explanation: string | null;
  evaluatedAt: string;
}

// ─── Decision Tree ───────────────────────────────────────────────────────────

export interface DecisionTreeNode {
  ruleName: string;
  status: string;
  next: DecisionTreeNode | null;
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export interface TimelineEntry {
  time: string;
  ruleName: string;
  outcome: string;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface TraceStatistics {
  rulesEvaluated: number;
  passed: number;
  failed: number;
  warnings: number;
  executionTimeMs: number;
}

// ─── Filter & Search Params ──────────────────────────────────────────────────

export interface TraceFilterParams {
  passed?: boolean;
  failed?: boolean;
  severity?: string;
  rule?: string;
  format?: string;
}

export interface TraceSearchParams {
  ruleName?: string;
  ruleId?: string;
  date?: string;
  quotationId?: string;
  outcome?: string;
}

// ─── Empty Trace Response ────────────────────────────────────────────────────

export interface EmptyTraceResponse {
  message: string;
}
