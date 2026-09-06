/**
 * RuleEvaluationService
 *
 * Persists RuleResult arrays to the RuleEvaluation table and updates
 * the Quotation's riskScore and approvalState.
 *
 * All writes happen inside a single Prisma transaction so either
 * everything is committed or nothing is.
 */

import type { PrismaClient, Prisma } from "@prisma/client";
import type { RuleResult } from "../interfaces/Rule.js";
import { ApprovalLevel } from "../interfaces/Rule.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("rule-evaluation-service");

/** Map our boolean passed + severity to the Prisma RuleOutcome enum. */
function toOutcome(result: RuleResult): "PASS" | "FAIL" | "WARN" | "SKIP" {
  if (!result.passed) return "FAIL";
  if (result.severity === "WARNING") return "WARN";
  return "PASS";
}

/** Map ApprovalLevel to Prisma ApprovalStatus. */
function toApprovalState(level: ApprovalLevel): "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" {
  switch (level) {
    case ApprovalLevel.AUTO_APPROVE:
      return "APPROVED";
    case ApprovalLevel.REJECT:
      return "REJECTED";
    default:
      return "PENDING";
  }
}

export class RuleEvaluationService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Persist all rule results for a quotation in a single transaction.
   *
   * 1. Delete any existing RuleEvaluation rows for this quotation
   *    (re-evaluation replaces the previous trace).
   * 2. Create new RuleEvaluation rows.
   * 3. Update Quotation.riskScore and Quotation.approvalState.
   */
  async persist(quotationId: string, results: RuleResult[]): Promise<void> {
    const riskResult = results.find((r) => r.ruleId === "blended-risk");
    const routingResult = results.find((r) => r.ruleId === "approval-routing");

    const riskScore = riskResult?.score ?? null;
    const approvalLevel = routingResult?.approvalLevel ?? ApprovalLevel.AUTO_APPROVE;

    await this.prisma.$transaction(async (tx) => {
      // 1. Clear previous evaluations
      await tx.ruleEvaluation.deleteMany({
        where: { quotationId },
      });

      // 2. Insert new evaluations
      await tx.ruleEvaluation.createMany({
        data: results.map((r) => ({
          quotationId,
          ruleId: r.ruleId,
          ruleName: r.ruleName,
          outcome: toOutcome(r),
          severity: r.severity,
          score: r.score,
          message: r.message,
          metadata: {
            computedValue: r.computedValue,
            threshold: r.threshold,
            approvalLevel: r.approvalLevel,
            metadata: r.metadata,
          } as unknown as Prisma.InputJsonValue,
        })),
      });

      // 3. Update quotation riskScore only (lifecycle state is governed by State Machine)
      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          riskScore: riskScore !== null ? Math.round(riskScore) : undefined,
        },
      });
    });

    log.info(
      { quotationId, ruleCount: results.length, riskScore, approvalLevel },
      "Decision trace persisted",
    );
  }
}
