/**
 * TraceBuilder
 *
 * Pure functions that transform raw RuleEvaluation records into
 * structured decision-trace output. No database dependency — all
 * functions accept pre-loaded data and return computed structures.
 *
 * The builder preserves execution order (evaluatedAt ASC) and
 * derives every piece of information deterministically from
 * persisted data. No LLM, no manual explanations.
 */

import type {
  RuleEvaluationRecord,
  RuleEvaluationInputs,
  RuleSeverity,
} from "../types/types.js";
import type {
  DecisionTraceRuleEntry,
  DecisionTreeNode,
  TimelineEntry,
  TraceStatistics,
  TraceFilterParams,
} from "../interfaces/interfaces.js";

// ─── Severity Mapping ────────────────────────────────────────────────────────

/**
 * Map the rule engine's Severity enum (persisted in inputs.severity)
 * to the Decision Trace severity levels.
 */
function mapSeverity(engineSeverity: string): RuleSeverity {
  switch (engineSeverity) {
    case "INFO":
      return "LOW";
    case "WARNING":
      return "MEDIUM";
    case "CRITICAL":
      return "CRITICAL";
    default:
      return "LOW";
  }
}

// ─── Input Extraction ────────────────────────────────────────────────────────

/**
 * Safely parse the inputs JSON column.
 * Falls back to a sensible default if the shape is unexpected.
 */
function parseInputs(raw: unknown): RuleEvaluationInputs {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      ruleId: typeof obj.ruleId === "string" ? obj.ruleId : "",
      computedValue: typeof obj.computedValue === "number" ? obj.computedValue : 0,
      threshold: typeof obj.threshold === "number" ? obj.threshold : 0,
      severity: typeof obj.severity === "string" ? obj.severity : "INFO",
      approvalLevel: typeof obj.approvalLevel === "string" ? obj.approvalLevel : "AUTO_APPROVE",
      metadata: (typeof obj.metadata === "object" && obj.metadata !== null)
        ? obj.metadata as Record<string, unknown>
        : {},
    };
  }
  return {
    ruleId: "",
    computedValue: 0,
    threshold: 0,
    severity: "INFO",
    approvalLevel: "AUTO_APPROVE",
    metadata: {},
  };
}

// ─── Rule Entries ────────────────────────────────────────────────────────────

/**
 * Convert raw DB records into structured API-ready rule entries.
 * Preserves the order of the input array (assumed evaluatedAt ASC).
 */
export function buildRuleEntries(
  evaluations: RuleEvaluationRecord[],
): DecisionTraceRuleEntry[] {
  return evaluations.map((ev) => {
    const inputs = parseInputs(ev.inputs);
    return {
      ruleId: inputs.ruleId || ev.ruleId || ev.id,
      ruleName: ev.ruleName,
      status: ev.outcome,
      severity: mapSeverity(inputs.severity),
      inputs: inputs.metadata,
      computedValue: ev.computedValue,
      threshold: ev.threshold,
      outcome: ev.outcome,
      explanation: ev.explanation,
      evaluatedAt: ev.evaluatedAt.toISOString(),
    };
  });
}

// ─── Overall Decision ────────────────────────────────────────────────────────

/**
 * Derive the top-level decision text from the ApprovalRoutingRule entry.
 * Falls back to a generic message if the routing rule isn't present.
 */
export function buildOverallDecision(entries: DecisionTraceRuleEntry[]): string {
  const routingEntry = entries.find((e) => e.ruleId === "approval-routing");
  if (routingEntry?.explanation) {
    return routingEntry.explanation;
  }

  const failedCount = entries.filter((e) => e.status === "FAIL").length;
  if (failedCount === 0) {
    return "All rules passed. Quotation can be auto-approved.";
  }
  return `${failedCount} rule(s) failed. Review required.`;
}

// ─── Overall Risk Score ──────────────────────────────────────────────────────

/**
 * Extract the blended risk score from the BlendedRiskRule entry.
 * Falls back to 0 if not present.
 */
export function buildOverallRiskScore(entries: DecisionTraceRuleEntry[]): number {
  const riskEntry = entries.find((e) => e.ruleId === "blended-risk");
  if (riskEntry) {
    return typeof riskEntry.computedValue === "number"
      ? Math.round(riskEntry.computedValue * 100) / 100
      : 0;
  }
  return 0;
}

// ─── Approval Level ──────────────────────────────────────────────────────────

/**
 * Extract the final approval level from the ApprovalRoutingRule's
 * persisted inputs.
 */
export function buildApprovalLevel(
  evaluations: RuleEvaluationRecord[],
): string {
  const routingEval = evaluations.find((ev) => {
    const inputs = parseInputs(ev.inputs);
    return inputs.ruleId === "approval-routing";
  });

  if (routingEval) {
    const inputs = parseInputs(routingEval.inputs);
    const finalLevel = inputs.metadata?.finalLevel;
    if (typeof finalLevel === "string") {
      return finalLevel;
    }
    return inputs.approvalLevel;
  }

  return "AUTO_APPROVE";
}

// ─── Summary Generator ───────────────────────────────────────────────────────

/**
 * Generate a deterministic, concise summary from the rule entries.
 *
 * Example output:
 *   "Finance approval required because
 *    - Discount exceeded customer limit
 *    - Margin dropped below threshold
 *    2 rules triggered."
 *
 * No LLM. Purely deterministic.
 */
export function buildSummary(
  entries: DecisionTraceRuleEntry[],
  approvalLevel: string,
): string {
  const triggered = entries.filter(
    (e) => e.status === "FAIL" || e.status === "WARN",
  );

  if (triggered.length === 0) {
    return "All rules passed. No issues detected.";
  }

  // Header based on approval level
  const header = buildSummaryHeader(approvalLevel);

  // Bullet points from explanations
  const bullets = triggered
    .map((e) => {
      if (e.explanation) {
        // Extract the core reason — take first sentence if multi-sentence
        const reason = e.explanation.split(".")[0].trim();
        return `- ${reason}`;
      }
      return `- ${e.ruleName} ${e.status === "FAIL" ? "failed" : "triggered a warning"}`;
    })
    .join("\n");

  const countLine = `${triggered.length} rule${triggered.length === 1 ? "" : "s"} triggered.`;

  return `${header}\n${bullets}\n${countLine}`;
}

function buildSummaryHeader(approvalLevel: string): string {
  switch (approvalLevel) {
    case "MANAGER":
      return "Manager approval required because";
    case "FINANCE":
      return "Finance approval required because";
    case "EXECUTIVE":
      return "Executive approval required because";
    case "REJECT":
      return "Quotation rejected because";
    default:
      return "Issues detected:";
  }
}

// ─── Decision Tree ───────────────────────────────────────────────────────────

/**
 * Build a linked-list decision tree from rule entries.
 * Preserves execution order for future frontend visualization.
 */
export function buildDecisionTree(
  entries: DecisionTraceRuleEntry[],
): DecisionTreeNode[] {
  if (entries.length === 0) return [];

  // Build as a flat array with `next` pointers forming the chain
  const nodes: DecisionTreeNode[] = entries.map((entry) => ({
    ruleName: entry.ruleName,
    status: entry.status,
    next: null,
  }));

  // Link each node to the next
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].next = nodes[i + 1];
  }

  return nodes;
}

// ─── Timeline ────────────────────────────────────────────────────────────────

/**
 * Build a timeline of rule evaluations with formatted timestamps.
 */
export function buildTimeline(
  entries: DecisionTraceRuleEntry[],
): TimelineEntry[] {
  return entries.map((entry) => {
    const date = new Date(entry.evaluatedAt);
    const time = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    return {
      time,
      ruleName: entry.ruleName,
      outcome: entry.status,
    };
  });
}

// ─── Statistics ──────────────────────────────────────────────────────────────

/**
 * Compute aggregate statistics from rule entries.
 *
 * @param entries       Structured rule entries.
 * @param queryDurationMs  Database query time in milliseconds.
 */
export function buildStatistics(
  entries: DecisionTraceRuleEntry[],
  queryDurationMs: number,
): TraceStatistics {
  return {
    rulesEvaluated: entries.length,
    passed: entries.filter((e) => e.status === "PASS").length,
    failed: entries.filter((e) => e.status === "FAIL").length,
    warnings: entries.filter((e) => e.status === "WARN").length,
    executionTimeMs: Math.round(queryDurationMs),
  };
}

// ─── Filtering ───────────────────────────────────────────────────────────────

/**
 * Apply filter parameters to rule entries.
 *
 * Supports:
 *   ?passed=true    → only PASS entries
 *   ?failed=true    → only FAIL entries
 *   ?severity=HIGH  → only entries with matching severity
 *   ?rule=DiscountCeilingRule → partial match on ruleName
 */
export function filterEntries(
  entries: DecisionTraceRuleEntry[],
  filters: TraceFilterParams,
): DecisionTraceRuleEntry[] {
  let result = [...entries];

  if (filters.passed === true) {
    result = result.filter((e) => e.status === "PASS");
  }

  if (filters.failed === true) {
    result = result.filter((e) => e.status === "FAIL");
  }

  if (filters.severity) {
    const sev = filters.severity.toUpperCase();
    result = result.filter((e) => e.severity === sev);
  }

  if (filters.rule) {
    const needle = filters.rule.toLowerCase();
    result = result.filter((e) =>
      e.ruleName.toLowerCase().includes(needle),
    );
  }

  return result;
}
