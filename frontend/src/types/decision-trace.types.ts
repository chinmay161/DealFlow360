export type RuleOutcome = "PASS" | "FAIL" | "WARN" | "SKIP";
export type RuleSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DecisionTraceRuleEntry {
  ruleId: string;
  ruleName: string;
  outcome: RuleOutcome;
  severity: RuleSeverity;
  computedValue: number;
  threshold: number;
  explanation: string;
  evaluatedAt: string;
  inputs: Record<string, any>;
  recommendation?: string | null;
}

export interface DecisionTraceSummary {
  overallDecision: "AUTO_APPROVE" | "PENDING_APPROVAL" | "REJECTED" | "ESCALATED";
  approvalLevel: "AUTO" | "MANAGER" | "FINANCE" | "VP" | "EXECUTIVE";
  riskScore: number;
  totalRules: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  recommendations: string[];
}

export interface DecisionTraceResponse {
  quotationId: string;
  summary: DecisionTraceSummary;
  entries: DecisionTraceRuleEntry[];
  evaluatedAt: string;
}
