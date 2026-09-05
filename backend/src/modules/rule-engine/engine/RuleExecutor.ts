/**
 * RuleExecutor — Runs a list of rules against a context with error isolation.
 *
 * Each rule is wrapped in try/catch so a single failure does not crash the
 * engine. Failed rules produce a CRITICAL result with error details.
 */

import type { Rule, RuleResult } from "../interfaces/Rule.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import type { RuleContext } from "./RuleContext.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("rule-executor");

export class RuleExecutor {
  /**
   * Execute all rules sequentially. Each rule receives the accumulated
   * results from prior rules (needed by ApprovalRoutingRule).
   *
   * @returns Ordered array of RuleResult — one per rule.
   */
  async execute(rules: Rule[], context: RuleContext): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    for (const rule of rules) {
      const startMs = performance.now();

      try {
        const result = await rule.evaluate(context, results);
        const elapsed = performance.now() - startMs;

        // Override executionTimeMs with our own measurement for accuracy
        results.push({ ...result, executionTimeMs: elapsed });

        log.info(
          {
            ruleId: rule.id,
            passed: result.passed,
            score: result.score,
            executionTimeMs: Math.round(elapsed * 100) / 100,
            quotationId: context.quotation.id,
          },
          `Rule "${rule.name}" evaluated`,
        );
      } catch (error) {
        const elapsed = performance.now() - startMs;
        const errorMessage = error instanceof Error ? error.message : String(error);

        log.error(
          {
            ruleId: rule.id,
            error: errorMessage,
            quotationId: context.quotation.id,
          },
          `Rule "${rule.name}" threw an exception`,
        );

        // Produce a CRITICAL failure result so the trace is complete
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          severity: Severity.CRITICAL,
          score: 100,
          computedValue: 0,
          threshold: 0,
          approvalRequired: true,
          approvalLevel: ApprovalLevel.EXECUTIVE,
          message: `Rule execution error: ${errorMessage}`,
          metadata: {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
          },
          executionTimeMs: elapsed,
        });
      }
    }

    return results;
  }
}
