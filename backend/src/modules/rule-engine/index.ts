/**
 * Rule Engine — Barrel Export
 *
 * Single entry point for consumers:
 *
 *   import { RuleEngine, RuleRegistry } from "./modules/rule-engine";
 *   const engine = new RuleEngine(prisma);
 *   const result = await engine.evaluate(quotationId);
 */

// ── Engine core ──────────────────────────────────────────────────────────────
export { RuleEngine } from "./engine/RuleEngine.js";
export { RuleRegistry } from "./engine/RuleRegistry.js";
export { RuleExecutor } from "./engine/RuleExecutor.js";
export { buildRuleContext } from "./engine/RuleContext.js";
export type { RuleContext } from "./engine/RuleContext.js";

// ── Types & interfaces ──────────────────────────────────────────────────────
export type {
  Rule,
  RuleResult,
  RuleEngineResult,
  Recommendation,
} from "./interfaces/Rule.js";
export { Severity, ApprovalLevel } from "./interfaces/Rule.js";

// ── Services ─────────────────────────────────────────────────────────────────
export { RuleEvaluationService } from "./services/RuleEvaluationService.js";
// NOTE: DecisionTraceService has been moved to src/modules/decision-trace/
// which provides a richer implementation with formatting, filtering, export, etc.

// ── Rules ────────────────────────────────────────────────────────────────────
import { DiscountCeilingRule } from "./rules/DiscountCeilingRule.js";
import { CategoryDiscountRule } from "./rules/CategoryDiscountRule.js";
import { MarginRule } from "./rules/MarginRule.js";
import { CustomerTierRule } from "./rules/CustomerTierRule.js";
import { BlendedRiskRule } from "./rules/BlendedRiskRule.js";
import { ApprovalRoutingRule } from "./rules/ApprovalRoutingRule.js";
import { RuleRegistry } from "./engine/RuleRegistry.js";

/**
 * Bootstrap all default rules into the registry.
 *
 * Call this once at application startup. New rules only need to be
 * added to this function and implement the Rule interface — no other
 * code changes required.
 */
export function bootstrapRules(): void {
  const registry = RuleRegistry.getInstance();

  // Order matters: ApprovalRoutingRule must be last because it
  // inspects prior results to determine the approval level.
  registry.register(new DiscountCeilingRule());
  registry.register(new CategoryDiscountRule());
  registry.register(new MarginRule());
  registry.register(new CustomerTierRule());
  registry.register(new BlendedRiskRule());
  registry.register(new ApprovalRoutingRule()); // ← always last
}
