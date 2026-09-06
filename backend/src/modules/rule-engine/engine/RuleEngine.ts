/**
 * RuleEngine — Top-level orchestrator.
 *
 * Public API:
 *   const result = await ruleEngine.evaluate(quotationId);
 *
 * Flow:
 *   1. Build RuleContext from DB
 *   2. Load rules from RuleRegistry
 *   3. Execute via RuleExecutor
 *   4. Aggregate results into RuleEngineResult
 *   5. Persist decision trace via RuleEvaluationService
 *   6. Return
 */

import type { PrismaClient } from "@prisma/client";
import type { RuleEngineResult, Recommendation } from "../interfaces/Rule.js";
import { ApprovalLevel, Severity } from "../interfaces/Rule.js";
import type { RuleResult } from "../interfaces/Rule.js";
import { buildRuleContext, type RuleContext } from "./RuleContext.js";
import { RuleRegistry } from "./RuleRegistry.js";
import { RuleExecutor } from "./RuleExecutor.js";
import { RuleEvaluationService } from "../services/RuleEvaluationService.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("rule-engine");

/** Approval level ordering for comparison (higher = more restrictive). */
const APPROVAL_ORDER: Record<ApprovalLevel, number> = {
  [ApprovalLevel.AUTO_APPROVE]: 0,
  [ApprovalLevel.MANAGER]: 1,
  [ApprovalLevel.FINANCE]: 2,
  [ApprovalLevel.EXECUTIVE]: 3,
  [ApprovalLevel.REJECT]: 4,
};

export class RuleEngine {
  private readonly executor = new RuleExecutor();
  private readonly evaluationService: RuleEvaluationService;

  constructor(private readonly prisma: PrismaClient) {
    this.evaluationService = new RuleEvaluationService(prisma);
  }

  /**
   * Evaluate a quotation against all registered rules.
   *
   * @param target  UUID of the quotation or an in-memory RuleContext (for simulations).
   * @param options Optional configuration (e.g. persistTrace).
   * @returns Aggregate RuleEngineResult with trace, recommendations, and decision.
   */
  async evaluate(
    target: string | RuleContext,
    options?: { persistTrace?: boolean },
  ): Promise<RuleEngineResult> {
    const overallStart = performance.now();

    const isContext = typeof target !== "string";
    const quotationId = isContext ? target.quotation.id : target;

    log.info({ quotationId, isSimulated: isContext }, "Starting rule engine evaluation");

    // 1 — Build context or use provided in-memory context
    const context = isContext ? target : await buildRuleContext(this.prisma, quotationId);

    // 2 — Get registered rules
    const registry = RuleRegistry.getInstance();
    let rules = registry.getAll();

    if (rules.length === 0) {
      log.warn({ quotationId }, "RuleRegistry empty — attempting on-demand bootstrapRules()");
      const { bootstrapRules } = await import("../index.js");
      bootstrapRules();
      rules = registry.getAll();
    }

    if (rules.length === 0) {
      log.error({ quotationId }, "RuleRegistry failed to bootstrap — refusing silent auto-approval");
      throw new Error(
        "Governance Exception: Rule Registry is unpopulated and bootstrap failed. Refusing silent auto-approval."
      );
    }

    // 3 — Execute
    const results = await this.executor.execute(rules, context);

    // 4 — Aggregate
    const engineResult = this.aggregate(results);

    // 5 — Persist trace (only if not simulated or explicitly requested)
    const shouldPersist = options?.persistTrace ?? !isContext;
    if (shouldPersist) {
      try {
        await this.evaluationService.persist(quotationId, results);
      } catch (err) {
        log.error({ quotationId, error: err }, "Failed to persist decision trace");
        // Non-fatal: we still return the result to the caller
      }
    }

    const totalMs = performance.now() - overallStart;
    log.info(
      {
        quotationId,
        approved: engineResult.approved,
        approvalLevel: engineResult.approvalLevel,
        riskScore: engineResult.overallRiskScore,
        totalMs: Math.round(totalMs * 100) / 100,
      },
      "Rule engine evaluation complete",
    );

    return engineResult;
  }

  // ─── Aggregation ─────────────────────────────────────────────────────

  private aggregate(results: RuleResult[]): RuleEngineResult {
    const failedRules = results.filter((r) => !r.passed);
    const warnings = results.filter(
      (r) => r.passed && r.severity === Severity.WARNING,
    );
    const triggeredRules = results.filter(
      (r) => !r.passed || r.approvalRequired,
    );

    // Highest approval level across all results
    let highestLevel = ApprovalLevel.AUTO_APPROVE;
    for (const r of results) {
      if (APPROVAL_ORDER[r.approvalLevel] > APPROVAL_ORDER[highestLevel]) {
        highestLevel = r.approvalLevel;
      }
    }

    // Risk score — prefer the BlendedRiskRule's score if present
    const riskResult = results.find((r) => r.ruleId === "blended-risk");
    const overallRiskScore = riskResult ? riskResult.score : this.fallbackRiskScore(results);

    // Approved only if no rule explicitly failed AND highestLevel is AUTO_APPROVE
    // A quotation requiring MANAGER, FINANCE, or EXECUTIVE approval is NOT auto-approved.
    const approved =
      failedRules.length === 0 && highestLevel === ApprovalLevel.AUTO_APPROVE;

    // Build recommendations from failed rules' metadata
    const recommendations = this.buildRecommendations(results);

    // Decision text
    const decision = this.buildDecisionText(approved, highestLevel, failedRules.length);

    return {
      approved,
      approvalLevel: highestLevel,
      overallRiskScore: Math.round(overallRiskScore * 100) / 100,
      decision,
      triggeredRules,
      failedRules,
      warnings,
      trace: results,
      recommendations,
    };
  }

  private fallbackRiskScore(results: RuleResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.score, 0) / results.length;
  }

  private buildRecommendations(results: RuleResult[]): Recommendation[] {
    const recs: Recommendation[] = [];
    for (const r of results) {
      if (r.metadata?.recommendation) {
        recs.push(r.metadata.recommendation as Recommendation);
      }
    }
    return recs;
  }

  private buildDecisionText(
    approved: boolean,
    level: ApprovalLevel,
    failCount: number,
  ): string {
    if (approved && level === ApprovalLevel.AUTO_APPROVE) {
      return "Quotation auto-approved. All rules passed.";
    }
    if (level === ApprovalLevel.REJECT || failCount > 0) {
      return `Quotation requires approval review. ${failCount} rule(s) failed / flagged exceptions.`;
    }
    return `Quotation requires ${level} approval before proceeding.`;
  }

  private emptyResult(): RuleEngineResult {
    return {
      approved: false,
      approvalLevel: ApprovalLevel.MANAGER,
      overallRiskScore: 50,
      decision: "Governance evaluation unavailable — manual review required. Refusing silent auto-approval.",
      triggeredRules: [],
      failedRules: [],
      warnings: [],
      trace: [],
      recommendations: [],
    };
  }
}
