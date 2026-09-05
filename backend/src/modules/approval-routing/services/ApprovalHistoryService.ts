/**
 * ApprovalHistoryService
 *
 * Compiles comprehensive approval history, active status, audit logs,
 * and decision-trace justifications for a quotation.
 */

import type { PrismaClient, RoleType } from "@prisma/client";
import type {
  ApprovalRecordDto,
  ApprovalHistoryEntry,
  ApproverUserInfo,
} from "../types/types.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-history-service");

export class ApprovalHistoryService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Load all approval records for a quotation with approver profile data.
   */
  async getApprovalsForQuotation(quotationId: string): Promise<ApprovalRecordDto[]> {
    const raw = await this.prisma.approval.findMany({
      where: { quotationId },
      include: {
        approver: {
          include: {
            role: true,
          },
        },
      },
      orderBy: [
        { stage: "asc" },
        { createdAt: "asc" },
      ],
    });

    return raw.map((a) => ({
      id: a.id,
      quotationId: a.quotationId,
      stage: a.stage,
      status: a.status,
      action: a.action,
      comments: a.comments,
      decidedAt: a.decidedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      approver: {
        id: a.approver.id,
        email: a.approver.email,
        firstName: a.approver.firstName,
        lastName: a.approver.lastName,
        role: a.approver.role.name as RoleType,
      },
    }));
  }

  /**
   * Build chronological history list combining approval records.
   */
  async getHistoryTimeline(quotationId: string): Promise<ApprovalHistoryEntry[]> {
    const approvals = await this.getApprovalsForQuotation(quotationId);

    return approvals.map((a) => ({
      id: a.id,
      stage: a.stage,
      status: a.status,
      action: a.action,
      comments: a.comments,
      decidedAt: a.decidedAt,
      createdAt: a.createdAt,
      approver: a.approver,
    }));
  }

  /**
   * Extract explanation from persisted RuleEvaluations to answer
   * "Why was approval required?".
   */
  async getApprovalReason(quotationId: string): Promise<string> {
    try {
      const evaluations = await this.prisma.ruleEvaluation.findMany({
        where: { quotationId },
        orderBy: { evaluatedAt: "asc" },
      });

      const triggered = evaluations.filter((e) => e.outcome === "FAIL" || e.outcome === "WARN");
      if (triggered.length === 0) {
        return "Quotation satisfied standard policies.";
      }

      const reasons = triggered
        .map((e) => `${e.ruleName}: ${e.explanation ?? "Threshold exceeded"}`)
        .join("; ");

      return `Approval required due to: ${reasons}`;
    } catch (err) {
      log.debug({ quotationId, err }, "Could not fetch approval reasoning from rule evaluations");
      return "Approval required based on business rule engine evaluation.";
    }
  }
}
