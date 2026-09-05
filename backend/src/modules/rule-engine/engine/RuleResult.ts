/**
 * RuleResult — Re-exports from the Rule interface file.
 *
 * This file exists to match the requested directory structure. The canonical
 * type definitions live in `interfaces/Rule.ts` to avoid circular deps.
 */

export type {
  RuleResult,
  RuleEngineResult,
  Recommendation,
} from "../interfaces/Rule.js";

export {
  Severity,
  ApprovalLevel,
} from "../interfaces/Rule.js";
