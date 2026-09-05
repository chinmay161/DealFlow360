/**
 * ApprovalRoutingRule
 *
 * Determines the required approval level based on collected results from
 * all prior rules. This rule MUST execute last.
 *
 * Routing logic reads ApprovalRule rows from the database (via context)
 * to determine stage thresholds. Falls back to a sensible default if
 * no DB rules are configured.
 *
 * Routing matrix:
 *   All pass, risk < 20        → AUTO_APPROVE
 *   Any warning, risk 20–50    → MANAGER
 *   Any financial fail, risk 50–75 → FINANCE
 *   Multiple fails, risk > 75  → EXECUTIVE
 *   Critical violations         → REJECT
 */

import type { Rule, RuleResult } from "../interfaces/Rule.js";
import { Severity, ApprovalLevel } from "../interfaces/Rule.js";
import type { RuleContext } from "../engine/RuleContext.js";

export class ApprovalRoutingRule implements Rule {
  readonly id = "approval-routing";
  readonly name = "Approval Routing Rule";
  readonly description =
    "Determines the approval level required based on aggregated rule results and DB-configured thresholds.";

  async evaluate(context: RuleContext, priorResults: RuleResult[] = []): Promise<RuleResult> {
    const { approvalRules, blendedDiscountPct } = context;

    const failedRules = priorResults.filter((r) => !r.passed);
    const criticalCount = failedRules.filter((r) => r.severity === Severity.CRITICAL).length;
    const warningCount = priorResults.filter(
      (r) => r.severity === Severity.WARNING,
    ).length;

    // Risk score from BlendedRiskRule (if available)
    const riskResult = priorResults.find((r) => r.ruleId === "blended-risk");
    const riskScore = riskResult?.score ?? 0;

    // ── DB-driven routing: check ApprovalRule thresholds ─────────────────

    let dbLevel = ApprovalLevel.AUTO_APPROVE;
    let matchedApprovalRule: string | undefined;

    // ApprovalRules are ordered by stage ASC. Walk from lowest to highest
    // and find the highest stage whose threshold is exceeded.
    for (const rule of approvalRules) {
      if (blendedDiscountPct >= rule.threshold) {
        // Map approverRole to ApprovalLevel
        const level = this.roleToLevel(rule.approverRole);
        if (this.levelOrder(level) > this.levelOrder(dbLevel)) {
          dbLevel = level;
          matchedApprovalRule = rule.id;
        }
      }
    }

    // ── Heuristic routing (overlay on DB routing) ────────────────────────

    let heuristicLevel = ApprovalLevel.AUTO_APPROVE;

    if (criticalCount > 0 || riskScore > 90) {
      heuristicLevel = ApprovalLevel.REJECT;
    } else if (failedRules.length >= 3 || riskScore > 75) {
      heuristicLevel = ApprovalLevel.EXECUTIVE;
    } else if (
      failedRules.some((r) => ["margin", "discount-ceiling"].includes(r.ruleId)) ||
      (riskScore > 50 && riskScore <= 75)
    ) {
      heuristicLevel = ApprovalLevel.FINANCE;
    } else if (warningCount > 0 || (riskScore > 20 && riskScore <= 50)) {
      heuristicLevel = ApprovalLevel.MANAGER;
    }

    // Take the more restrictive of DB and heuristic routing
    const finalLevel =
      this.levelOrder(dbLevel) > this.levelOrder(heuristicLevel)
        ? dbLevel
        : heuristicLevel;

    const passed = finalLevel !== ApprovalLevel.REJECT;

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed,
      severity:
        finalLevel === ApprovalLevel.REJECT
          ? Severity.CRITICAL
          : finalLevel === ApprovalLevel.AUTO_APPROVE
            ? Severity.INFO
            : Severity.WARNING,
      score: riskScore,
      computedValue: riskScore,
      threshold: 75, // reject threshold
      approvalRequired: finalLevel !== ApprovalLevel.AUTO_APPROVE,
      approvalLevel: finalLevel,
      message: this.buildMessage(finalLevel, failedRules.length, warningCount, riskScore),
      metadata: {
        dbRoutedLevel: dbLevel,
        heuristicLevel,
        finalLevel,
        matchedApprovalRuleId: matchedApprovalRule,
        failedCount: failedRules.length,
        criticalCount,
        warningCount,
        riskScore,
      },
      executionTimeMs: 0,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private roleToLevel(role: string): ApprovalLevel {
    switch (role) {
      case "MANAGER":
        return ApprovalLevel.MANAGER;
      case "FINANCE":
        return ApprovalLevel.FINANCE;
      case "ADMIN":
        return ApprovalLevel.EXECUTIVE;
      default:
        return ApprovalLevel.MANAGER;
    }
  }

  private levelOrder(level: ApprovalLevel): number {
    const order: Record<ApprovalLevel, number> = {
      [ApprovalLevel.AUTO_APPROVE]: 0,
      [ApprovalLevel.MANAGER]: 1,
      [ApprovalLevel.FINANCE]: 2,
      [ApprovalLevel.EXECUTIVE]: 3,
      [ApprovalLevel.REJECT]: 4,
    };
    return order[level];
  }

  private buildMessage(
    level: ApprovalLevel,
    fails: number,
    warnings: number,
    risk: number,
  ): string {
    switch (level) {
      case ApprovalLevel.AUTO_APPROVE:
        return "All checks passed. Quotation can be auto-approved.";
      case ApprovalLevel.MANAGER:
        return `Manager approval required (${warnings} warning(s), risk score ${risk.toFixed(1)}).`;
      case ApprovalLevel.FINANCE:
        return `Finance approval required (${fails} failed rule(s), risk score ${risk.toFixed(1)}).`;
      case ApprovalLevel.EXECUTIVE:
        return `Executive approval required (${fails} failed rule(s), risk score ${risk.toFixed(1)}).`;
      case ApprovalLevel.REJECT:
        return `Quotation rejected. ${fails} critical violation(s) detected (risk score ${risk.toFixed(1)}).`;
    }
  }
}
