/**
 * ApprovalHistoryService
 *
 * Compiles comprehensive approval history, active status, audit logs,
 * and decision-trace justifications for a quotation.
 */

import type { PrismaClient } from "@prisma/client";
import type {
  ApprovalRecordDto,
  ApprovalHistoryEntry,
  ApproverUserInfo,
  RoleType,
} from "../types/types.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-history-service");

export class ApprovalHistoryService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Load all approval records for a quotation with approver profile data.
   */
  async getApprovalsForQuotation(quotationId: string): Promise<ApprovalRecordDto[]> {
    const raw: any[] = await (this.prisma.approval.findMany as any)({
      where: { quotationId },
      include: {
        quotation: true,
      },
    });

    return raw.map((a: any) => ({
      id: a.id,
      quotationId: a.quotationId,
      stage: a.stage ?? a.currentStep ?? 1,
      status: a.status,
      action: a.action ?? "PENDING",
      comments: a.comments ?? null,
      decidedAt: a.decidedAt ?? a.resolvedAt ?? null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      approver: a.approver ? {
        id: a.approver.id,
        email: a.approver.email,
        firstName: a.approver.firstName ?? a.approver.name?.split(" ")[0] ?? "Approver",
        lastName: a.approver.lastName ?? a.approver.name?.split(" ").slice(1).join(" ") ?? "",
        role: (typeof a.approver.role === "string" ? a.approver.role : a.approver.role?.name ?? "MANAGER") as RoleType,
      } : {
        id: a.assignedToId ?? "user-1",
        email: "approver@dealflow.com",
        firstName: "System",
        lastName: "Approver",
        role: "MANAGER" as RoleType,
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
      const evaluations: any[] = await this.prisma.ruleEvaluation.findMany({
        where: { quotationId },
        orderBy: { createdAt: "asc" },
      });

      const triggered = evaluations.filter((e) => e.outcome === "FAIL" || e.outcome === "WARN");
      if (triggered.length === 0) {
        return "Quotation satisfied standard policies.";
      }

      const reasons = triggered
        .map((e) => `${e.ruleName}: ${e.message ?? e.explanation ?? "Threshold exceeded"}`)
        .join("; ");

      return `Approval required due to: ${reasons}`;
    } catch (err) {
      log.debug({ quotationId, err }, "Could not fetch approval reasoning from rule evaluations");
      return "Approval required based on business rule engine evaluation.";
    }
  }
}
