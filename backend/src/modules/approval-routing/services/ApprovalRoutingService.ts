/**
 * ApprovalRoutingService
 *
 * Primary orchestrator for quotation approval routing in DealFlow360.
 *
 * Responsibilities:
 * - Consumes RuleEngine decisions without re-evaluating business rules
 * - Creates multi-stage approval chains (AUTO, MANAGER, FINANCE, EXECUTIVE)
 * - Assigns approvers via pluggable strategies
 * - Progresses quotations through approval stages
 * - Dispatches notifications to stakeholders
 * - Maintains complete audit trails in AuditLog
 */

import type { PrismaClient, Quotation } from "@prisma/client";
import { RuleEngine } from "../../rule-engine/index.js";
import type { RuleEngineResult } from "../../rule-engine/interfaces/Rule.js";
import type {
  WorkflowResult,
  WorkflowStatusResponse,
  ApprovalRecordDto,
  PendingApprovalsFilter,
  WorkflowStatus,
  RoleType,
} from "../types/types.js";
import {
  QuotationNotFoundError,
  ApprovalNotFoundError,
} from "../utils/errors.js";
import { ApprovalWorkflowService } from "./ApprovalWorkflowService.js";
import { ApprovalAssignmentService } from "./ApprovalAssignmentService.js";
import { ApprovalActionService } from "./ApprovalActionService.js";
import { ApprovalHistoryService } from "./ApprovalHistoryService.js";
import {
  NotificationProvider,
  MockNotificationProvider,
} from "../interfaces/NotificationProvider.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-routing-service");

export interface ApprovalRoutingServiceOptions {
  workflowService?: ApprovalWorkflowService;
  assignmentService?: ApprovalAssignmentService;
  actionService?: ApprovalActionService;
  historyService?: ApprovalHistoryService;
  notificationProvider?: NotificationProvider;
}

export class ApprovalRoutingService {
  private readonly workflowService: ApprovalWorkflowService;
  private readonly assignmentService: ApprovalAssignmentService;
  private readonly actionService: ApprovalActionService;
  private readonly historyService: ApprovalHistoryService;
  private readonly notificationProvider: NotificationProvider;

  constructor(
    private readonly prisma: PrismaClient,
    options?: ApprovalRoutingServiceOptions,
  ) {
    this.workflowService = options?.workflowService ?? new ApprovalWorkflowService();
    this.assignmentService = options?.assignmentService ?? new ApprovalAssignmentService(prisma);
    this.notificationProvider = options?.notificationProvider ?? new MockNotificationProvider();
    this.historyService = options?.historyService ?? new ApprovalHistoryService(prisma);
    this.actionService =
      options?.actionService ??
      new ApprovalActionService(
        prisma,
        this.workflowService,
        this.assignmentService,
        this.notificationProvider,
      );
  }

  /**
   * Start the approval workflow for a quotation.
   *
   * 1. Loads quotation
   * 2. Runs Rule Engine (if pre-evaluated result is not provided)
   * 3. Creates approval records based on required approval level
   * 4. Updates quotation status and writes audit log
   * 5. Notifies assigned approver or marks quotation auto-approved
   */
  async startWorkflow(
    quotationId: string,
    options?: {
      ruleEngineResult?: RuleEngineResult;
      approvalLevel?: string;
    },
  ): Promise<WorkflowResult> {
    const startTime = performance.now();
    log.info({ quotationId }, "Starting approval workflow");

    // 1. Load quotation
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      log.warn({ quotationId }, "Quotation not found for workflow start");
      throw new QuotationNotFoundError(quotationId);
    }

    // 2. Validate current quotation state
    this.workflowService.validateQuotationForStart(quotation);

    // 3. Obtain Rule Engine result
    let ruleResult = options?.ruleEngineResult;
    let requiredLevel = options?.approvalLevel;

    if (!ruleResult && !requiredLevel) {
      log.info({ quotationId }, "Evaluating quotation with RuleEngine");
      const engine = new RuleEngine(this.prisma);
      ruleResult = await engine.evaluate(quotationId);
    }

    if (ruleResult) {
      requiredLevel = ruleResult.approvalLevel;
    }

    let normalizedLevel = this.workflowService.normalizeLevel(requiredLevel ?? "AUTO_APPROVE");

    // Guard: A quotation that has rule violations or is not approved MUST NOT be auto-approved
    if (
      (normalizedLevel === "AUTO_APPROVE" || normalizedLevel === "AUTO") &&
      ruleResult &&
      (!ruleResult.approved || (ruleResult.failedRules && ruleResult.failedRules.length > 0))
    ) {
      log.warn(
        { quotationId, failedCount: ruleResult.failedRules?.length },
        "Governance exception detected: Quotation cannot be auto-approved. Escalating to MANAGER review.",
      );
      normalizedLevel = "MANAGER";
    }

    log.info({ quotationId, requiredLevel: normalizedLevel }, "Workflow approval level resolved");

    // ── Case A: Immediate REJECT by Rule Engine ───────────────────────────────
    if (normalizedLevel === "REJECT" || (ruleResult && !ruleResult.approved && normalizedLevel === "REJECT")) {
      await this.prisma.$transaction(async (tx) => {
        await (tx as any).quotation.update({
          where: { id: quotationId },
          data: {
            status: "REJECTED",
            approvalState: "REJECTED",
            currentStage: "REJECTED",
            riskScore: ruleResult?.overallRiskScore ?? undefined,
          },
        });

        if ((tx as any).auditLog) {
          await (tx as any).auditLog.create({
            data: {
              entity: "Quotation",
              entityId: quotationId,
              action: "UPDATE",
              prevValue: { status: quotation.status },
              newValue: {
                status: "REJECTED",
                approvalState: "REJECTED",
                reason: ruleResult?.decision ?? "Rejected by rule engine",
                workflowEvent: "WORKFLOW_REJECTED",
              },
            },
          });
        }
      });

      await this.notificationProvider.notifyApprovalRejected({
        quotationId,
        quoteNumber: (quotation as any).quotationNumber || (quotation as any).quoteNumber,
        rejectedBy: "RuleEngine",
        comments: ruleResult?.decision ?? "Quotation violated hard risk boundaries.",
      });

      const execMs = Math.round(performance.now() - startTime);
      log.info({ quotationId, execMs, status: "REJECTED" }, "Quotation rejected by rule engine");

      return {
        quotationId,
        workflowStatus: "REJECTED",
        approvalLevel: "REJECT",
        currentStage: null,
        totalStages: 0,
        message: "Quotation rejected based on rule engine evaluation. Workflow terminated.",
        decisionTraceId: quotationId,
      };
    }

    // ── Case B: AUTO_APPROVE ──────────────────────────────────────────────────
    if (normalizedLevel === "AUTO_APPROVE" || normalizedLevel === "AUTO") {
      log.info({ quotationId }, "Auto-approving quotation (no approvals required)");

      await this.prisma.$transaction(async (tx) => {
        await (tx as any).quotation.update({
          where: { id: quotationId },
          data: {
            status: "APPROVED",
            approvalState: "APPROVED",
            currentStage: "APPROVED",
            riskScore: ruleResult?.overallRiskScore ?? undefined,
          },
        });

        if ((tx as any).auditLog) {
          await (tx as any).auditLog.create({
            data: {
              entity: "Quotation",
              entityId: quotationId,
              action: "UPDATE",
              prevValue: { status: quotation.status },
              newValue: {
                status: "APPROVED",
                approvalState: "APPROVED",
                workflowEvent: "AUTO_APPROVED",
              },
            },
          });
        }
      });

      await this.notificationProvider.notifyApprovalCompleted({
        quotationId,
        quoteNumber: (quotation as any).quotationNumber || (quotation as any).quoteNumber,
        totalStages: 0,
      });

      const execMs = Math.round(performance.now() - startTime);
      log.info({ quotationId, execMs, status: "APPROVED" }, "Quotation auto-approved");

      return {
        quotationId,
        workflowStatus: "APPROVED",
        approvalLevel: "AUTO",
        currentStage: null,
        totalStages: 0,
        message: "Quotation auto-approved. No approval stages required.",
        decisionTraceId: quotationId,
      };
    }

    // ── Case C: Multi-Stage Workflow (MANAGER, FINANCE, EXECUTIVE) ─────────────
    const totalStages = this.workflowService.getTotalStages(normalizedLevel);
    const stage1Def = this.workflowService.getStageDefinition(normalizedLevel, 1);

    if (!stage1Def) {
      throw new Error(`Stage 1 definition missing for level: ${normalizedLevel}`);
    }

    // Find Stage 1 approver
    const approver = await this.assignmentService.assignApprover(stage1Def.role, {
      quotationId,
      stage: 1,
    });

    const approval = await this.prisma.$transaction(async (tx) => {
      // 1. Create Stage 1 Approval record
      const createdApproval = await (tx as any).approval.create({
        data: {
          stage: 1,
          status: "PENDING",
          quotationId,
          approverId: approver.id,
        },
        include: {
          approver: {
            include: { role: true },
          },
        },
      });

      // 2. Update Quotation status to PENDING_APPROVAL
      await (tx as any).quotation.update({
        where: { id: quotationId },
        data: {
          status: "PENDING_APPROVAL",
          approvalState: "PENDING",
          currentStage: "APPROVAL_PENDING",
          riskScore: ruleResult?.overallRiskScore ?? undefined,
        },
      });

      // 3. Write AuditLog for Workflow Start
      if ((tx as any).auditLog) {
        await (tx as any).auditLog.create({
          data: {
            entity: "Quotation",
            entityId: quotationId,
            action: "UPDATE",
            prevValue: { status: quotation.status },
            newValue: {
              status: "PENDING_APPROVAL",
              approvalState: "PENDING",
              workflowLevel: normalizedLevel,
              totalStages,
              workflowEvent: "WORKFLOW_STARTED",
            },
          },
        });

        // 4. Write AuditLog for Stage 1 assignment
        await (tx as any).auditLog.create({
          data: {
            entity: "Approval",
            entityId: createdApproval.id,
            action: "CREATE",
            userId: approver.id,
            newValue: {
              stage: 1,
              status: "PENDING",
              approverId: approver.id,
              workflowEvent: "APPROVAL_ASSIGNED",
            },
          },
        });
      }

      return createdApproval;
    });

    // Notify stage 1 approver
    await this.notificationProvider.notifyApprovalAssigned({
      quotationId,
      approvalId: approval.id,
      approverId: approver.id,
      stage: 1,
      stageName: stage1Def.name,
    });

    const pendingDto: ApprovalRecordDto = {
      id: approval.id,
      quotationId,
      stage: (approval as any).stage ?? (approval as any).currentStep ?? 1,
      status: approval.status,
      action: (approval as any).action ?? "PENDING",
      comments: (approval as any).comments ?? null,
      decidedAt: (approval as any).decidedAt ?? null,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      approver: {
        id: approver.id,
        email: approver.email,
        firstName: approver.firstName,
        lastName: approver.lastName,
        role: approver.role,
      },
    };

    const execMs = Math.round(performance.now() - startTime);
    log.info(
      {
        quotationId,
        approvalId: approval.id,
        approverId: approver.id,
        level: normalizedLevel,
        totalStages,
        execMs,
      },
      "Approval workflow started successfully",
    );

    return {
      quotationId,
      workflowStatus: "PENDING_APPROVAL",
      approvalLevel: normalizedLevel,
      currentStage: 1,
      totalStages,
      pendingApproval: pendingDto,
      message: `Approval workflow started. Stage 1 (${stage1Def.name}) assigned to ${approver.firstName} ${approver.lastName}.`,
      decisionTraceId: quotationId,
    };
  }

  /**
   * Approve a pending approval record.
   */
  async approve(
    approvalId: string,
    approverId?: string,
    comments?: string,
  ): Promise<WorkflowResult> {
    const startTime = performance.now();
    log.info({ approvalId, approverId }, "Processing approve action");

    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        quotation: true,
      },
    });

    if (!approval) {
      log.warn({ approvalId }, "Approval not found");
      throw new ApprovalNotFoundError(approvalId);
    }

    const existingApprovals = await this.prisma.approval.findMany({
      where: { quotationId: approval.quotationId },
    });

    // Enforce workflow validations
    this.workflowService.validateApprovalAction({
      approval: approval as any,
      approverId,
      action: "APPROVE",
      quotation: (approval as any).quotation,
      existingApprovals: existingApprovals as any,
    });

    const approvalLevel = await this.resolveApprovalLevel(approval.quotationId, existingApprovals as any);

    const result = await this.actionService.executeApprove({
      approval: approval as any,
      quotation: (approval as any).quotation,
      approverId: approverId ?? (approval as any).approverId,
      comments,
      approvalLevel,
    });

    const execMs = Math.round(performance.now() - startTime);
    log.info(
      {
        approvalId,
        quotationId: approval.quotationId,
        approverId,
        stage: (approval as any).stage ?? (approval as any).currentStep ?? 1,
        execMs,
      },
      "Approval processed successfully",
    );

    return result;
  }

  /**
   * Reject a pending approval record. Terminates workflow.
   */
  async reject(
    approvalId: string,
    approverId?: string,
    comments: string = "Rejected",
  ): Promise<WorkflowResult> {
    const startTime = performance.now();
    log.info({ approvalId, approverId }, "Processing reject action");

    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        quotation: true,
      },
    });

    if (!approval) {
      log.warn({ approvalId }, "Approval not found");
      throw new ApprovalNotFoundError(approvalId);
    }

    const existingApprovals = await this.prisma.approval.findMany({
      where: { quotationId: approval.quotationId },
    });

    this.workflowService.validateApprovalAction({
      approval: approval as any,
      approverId,
      action: "REJECT",
      quotation: (approval as any).quotation,
      existingApprovals: existingApprovals as any,
    });

    const approvalLevel = await this.resolveApprovalLevel(approval.quotationId, existingApprovals as any);

    const result = await this.actionService.executeReject({
      approval: approval as any,
      quotation: (approval as any).quotation,
      approverId: approverId ?? (approval as any).approverId,
      comments,
      approvalLevel,
    });

    const execMs = Math.round(performance.now() - startTime);
    log.info(
      {
        approvalId,
        quotationId: approval.quotationId,
        approverId,
        stage: (approval as any).stage ?? (approval as any).currentStep ?? 1,
        execMs,
      },
      "Rejection processed successfully",
    );

    return result;
  }

  /**
   * Return quotation for revision. Resets status to DRAFT.
   */
  async returnForRevision(
    approvalId: string,
    approverId?: string,
    comments: string = "Returned for revision",
  ): Promise<WorkflowResult> {
    const startTime = performance.now();
    log.info({ approvalId, approverId }, "Processing return for revision");

    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        quotation: true,
      },
    });

    if (!approval) {
      log.warn({ approvalId }, "Approval not found");
      throw new ApprovalNotFoundError(approvalId);
    }

    const existingApprovals = await this.prisma.approval.findMany({
      where: { quotationId: approval.quotationId },
    });

    this.workflowService.validateApprovalAction({
      approval: approval as any,
      approverId,
      action: "REQUEST_CHANGES",
      quotation: (approval as any).quotation,
      existingApprovals: existingApprovals as any,
    });

    const approvalLevel = await this.resolveApprovalLevel(approval.quotationId, existingApprovals as any);

    const result = await this.actionService.executeReturnForRevision({
      approval: approval as any,
      quotation: (approval as any).quotation,
      approverId: approverId ?? (approval as any).approverId,
      comments,
      approvalLevel,
    });

    const execMs = Math.round(performance.now() - startTime);
    log.info(
      {
        approvalId,
        quotationId: approval.quotationId,
        approverId,
        stage: (approval as any).stage ?? (approval as any).currentStep ?? 1,
        execMs,
      },
      "Return for revision processed successfully",
    );

    return result;
  }

  /**
   * Delegate pending approval to another user.
   */
  async delegate(
    approvalId: string,
    currentApproverId: string,
    newApproverId: string,
    comments?: string,
  ): Promise<ApprovalRecordDto> {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: { quotation: true },
    });

    if (!approval) {
      throw new ApprovalNotFoundError(approvalId);
    }

    const existingApprovals = await this.prisma.approval.findMany({
      where: { quotationId: approval.quotationId },
    });

    this.workflowService.validateApprovalAction({
      approval: approval as any,
      approverId: currentApproverId,
      action: "DELEGATE",
      quotation: (approval as any).quotation,
      existingApprovals: existingApprovals as any,
    });

    return this.actionService.executeDelegate({
      approval: approval as any,
      quotation: (approval as any).quotation,
      currentApproverId,
      newApproverId,
      comments,
    });
  }

  /**
   * Get workflow status summary and full history for a quotation.
   */
  async getWorkflowStatus(quotationId: string): Promise<WorkflowStatusResponse> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      throw new QuotationNotFoundError(quotationId);
    }

    const approvals = await this.historyService.getApprovalsForQuotation(quotationId);
    const history = await this.historyService.getHistoryTimeline(quotationId);
    const whyApprovalRequired = await this.historyService.getApprovalReason(quotationId);

    const approvalLevel = await this.resolveApprovalLevel(quotationId, approvals as any);
    const totalStages = this.workflowService.getTotalStages(approvalLevel);

    const pendingApproval = approvals.find((a) => a.status === "PENDING");
    const completedApprovals = approvals.filter((a) => a.status === "APPROVED");

    const workflowStatus: WorkflowStatus =
      quotation.status === "APPROVED"
        ? "APPROVED"
        : quotation.status === "REJECTED"
          ? "REJECTED"
          : quotation.status === "PENDING_APPROVAL"
            ? "PENDING_APPROVAL"
            : "DRAFT";

    return {
      quotationId: quotation.id,
      quoteNumber: (quotation as any).quotationNumber || (quotation as any).quoteNumber,
      workflowStatus,
      approvalLevel,
      currentStage: pendingApproval ? pendingApproval.stage : null,
      totalStages,
      pendingApprover: pendingApproval ? pendingApproval.approver : null,
      completedApprovals,
      history,
      decisionTraceId: quotation.id,
      whyApprovalRequired,
    };
  }

  /**
   * Retrieve list of pending approvals with filtering by role, user, or status.
   */
  async getPendingApprovals(filters: PendingApprovalsFilter = {}): Promise<ApprovalRecordDto[]> {
    const whereClause: any = {
      status: filters.status ?? "PENDING",
    };

    if (filters.userId) {
      whereClause.approverId = filters.userId;
      whereClause.assignedToId = filters.userId;
    }

    if (filters.role) {
      whereClause.approver = {
        role: {
          name: filters.role,
        },
      };
    }

    const raw: any[] = await (this.prisma.approval.findMany as any)({
      where: whereClause,
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

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Resolve target approval level for a quotation from persisted AuditLog, RuleEvaluations, or defaults.
   */
  private async resolveApprovalLevel(
    quotationId: string,
    existingApprovals?: Array<{ stage: number }>,
  ): Promise<string> {
    try {
      // 1. Check AuditLog for WORKFLOW_STARTED record with workflowLevel
      const auditLogs = await this.prisma.auditLog.findMany({
        where: {
          entity: "Quotation",
          entityId: quotationId,
        },
      });

      for (let i = auditLogs.length - 1; i >= 0; i--) {
        const entry = auditLogs[i];
        const nv = (entry.metadata as any)?.newValue ?? (entry as any).newValue;
        if (nv && typeof nv === "object" && nv.workflowLevel) {
          return this.workflowService.normalizeLevel(nv.workflowLevel);
        }
      }

      // 2. Check RuleEvaluation record
      const routingEval = await this.prisma.ruleEvaluation.findFirst({
        where: {
          quotationId,
          ruleName: "Approval Routing Rule",
        },
      });

      const evalInputs = ((routingEval as any)?.metadata as Record<string, any>) ?? (routingEval as any)?.inputs;
      if (evalInputs && typeof evalInputs === "object") {
        if (evalInputs.approvalLevel) {
          return this.workflowService.normalizeLevel(evalInputs.approvalLevel);
        }
        if (evalInputs.metadata?.finalLevel) {
          return this.workflowService.normalizeLevel(evalInputs.metadata.finalLevel);
        }
      }
    } catch {
      // Fallback below
    }

    // 3. Fallback: estimate from max stage in approvals
    if (existingApprovals && existingApprovals.length > 0) {
      const maxStage = Math.max(...existingApprovals.map((a) => a.stage));
      if (maxStage >= 3) return "EXECUTIVE";
      if (maxStage === 2) return "FINANCE";
      if (maxStage === 1) return "MANAGER";
    }

    return "MANAGER";
  }
}
