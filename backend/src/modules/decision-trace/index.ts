/**
 * Decision Trace Module — Barrel Export
 *
 * Single entry point for consumers:
 *
 *   import { DecisionTraceService, createDecisionTraceRouter } from "./modules/decision-trace";
 */

// ── Service ──────────────────────────────────────────────────────────────────
export { DecisionTraceService, QuotationNotFoundError } from "./services/DecisionTraceService.js";

// ── Builder & Formatter (for direct use or testing) ──────────────────────────
export {
  buildRuleEntries,
  buildOverallDecision,
  buildOverallRiskScore,
  buildApprovalLevel,
  buildSummary,
  buildDecisionTree,
  buildTimeline,
  buildStatistics,
  filterEntries,
} from "./services/TraceBuilder.js";

export {
  formatTrace,
  formatRuleEntry,
  formatPercentage,
  formatCurrency,
  formatDecimal,
} from "./services/TraceFormatter.js";

// ── Router ───────────────────────────────────────────────────────────────────
export { createDecisionTraceRouter } from "./routes/routes.js";

// ── Controller ───────────────────────────────────────────────────────────────
export { DecisionTraceController } from "./controllers/DecisionTraceController.js";

// ── Types & Interfaces ──────────────────────────────────────────────────────
export type {
  RuleEvaluationRecord,
  RuleEvaluationInputs,
  RuleOutcome,
  RuleSeverity,
  TraceFormat,
  ExportFormat,
} from "./types/types.js";

export type {
  DecisionTraceResponse,
  DecisionTraceRuleEntry,
  DecisionTreeNode,
  TimelineEntry,
  TraceStatistics,
  TraceFilterParams,
  TraceSearchParams,
  EmptyTraceResponse,
} from "./interfaces/interfaces.js";

// ── DTOs ─────────────────────────────────────────────────────────────────────
export {
  GetDecisionTraceQuerySchema,
  SearchDecisionTraceQuerySchema,
  ExportDecisionTraceQuerySchema,
  QuotationIdParamSchema,
} from "./dto/dto.js";

export type {
  GetDecisionTraceQuery,
  SearchDecisionTraceQuery,
  ExportDecisionTraceQuery,
  QuotationIdParam,
} from "./dto/dto.js";
