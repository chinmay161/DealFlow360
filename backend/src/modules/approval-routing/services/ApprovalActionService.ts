/**
 * ApprovalActionService
 *
 * Executes approval actions (Approve, Reject, Return for Revision, Delegate)
 * inside atomic Prisma transactions. Updates Approval and Quotation entities,
 * persists comprehensive AuditLog entries, and notifies stakeholders.
 */

import type { PrismaClient } from "@prisma/client";
import type { NotificationProvider } from "../interfaces/NotificationProvider.js";
import type { ApprovalAssignmentService } from "./ApprovalAssignmentService.js";
import type { ApprovalWorkflowService } from "./ApprovalWorkflowService.js";
import type { WorkflowResult, ApprovalRecordDto } from "../types/types.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-action-service");

export class ApprovalActionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly workflowService: ApprovalWorkflowService,
    private readonly assignmentService: ApprovalAssignmentService,
    private readonly notificationProvider: NotificationProvider,
  ) {}

  /**
   * Execute APPROVE action for an approval record.
   */
  async executeApprove(params: {
    approval: any;
    quotation: any;
    approverId: string;
    comments?: string;
    approvalLevel: string;
  }): Promise<WorkflowResult> {
    const { approval, quotation, approverId, comments, approvalLevel } = params;
    const isFinal = this.workflowService.isFinalStage(approvalLevel, approval.stage);
    const totalStages = this.workflowService.getTotalStages(approvalLevel);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update existing approval record
      const updatedApproval = await tx.approval.update({
        where: { id: approval.id },
        data: {
          status: "APPROVED",
          action: "APPROVE",
          comments: comments ?? null,
          decidedAt: new Date(),
        },
        include: {
          approver: {
            include: { role: true },
          },
        },
      });

      // 2. Write AuditLog for the approval decision
      await tx.auditLog.create({
        data: {
          entity: "Approval",
          entityId: approval.id,
          action: "APPROVE",
          userId: approverId,
          prevValue: { status: "PENDING" },
          newValue: {
            status: "APPROVED",
            action: "APPROVE",
            stage: approval.stage,
            comments: comments ?? null,
          },
        },
      });

      // 3. Stage progression or completion
      if (isFinal) {
        log.info(
          { quotationId: quotation.id, stage: approval.stage, totalStages },
          "Final approval stage reached — marking quotation APPROVED",
        );

        // Update quotation to APPROVED
        await tx.quotation.update({
          where: { id: quotation.id },
          data: {
            status: "APPROVED",
            approvalState: "APPROVED",
          },
        });

        // AuditLog for quotation approval completion
        await tx.auditLog.create({
          data: {
            entity: "Quotation",
            entityId: quotation.id,
            action: "UPDATE",
            userId: approverId,
            prevValue: {
              status: quotation.status,
              approvalState: quotation.approvalState,
            },
            newValue: {
              status: "APPROVED",
              approvalState: "APPROVED",
              workflowEvent: "WORKFLOW_COMPLETED",
            },
          },
        });

        await this.notificationProvider.notifyApprovalCompleted({
          quotationId: quotation.id,
          quoteNumber: quotation.quoteNumber,
          totalStages,
        });

        return {
          quotationId: quotation.id,
          workflowStatus: "APPROVED",
          approvalLevel,
          currentStage: null,
          totalStages,
          message: "Approval workflow completed successfully. Quotation is approved.",
          decisionTraceId: quotation.id,
        };
      } else {
        // Multi-stage progression: create next stage approval row
        const nextStageDef = this.workflowService.getNextStageDefinition(
          approvalLevel,
          approval.stage,
        );

        if (!nextStageDef) {
          throw new Error(`Next stage definition not found after stage ${approval.stage}`);
        }

        const nextApprover = await this.assignmentService.assignApprover(
          nextStageDef.role,
          { quotationId: quotation.id, stage: nextStageDef.stage, tx },
        );

        const newApproval = await tx.approval.create({
          data: {
            stage: nextStageDef.stage,
            status: "PENDING",
            quotationId: quotation.id,
            approverId: nextApprover.id,
          },
          include: {
            approver: {
              include: { role: true },
            },
          },
        });

        // AuditLog for new approval stage assignment
        await tx.auditLog.create({
          data: {
            entity: "Approval",
            entityId: newApproval.id,
            action: "CREATE",
            userId: nextApprover.id,
            newValue: {
              stage: nextStageDef.stage,
              status: "PENDING",
              approverId: nextApprover.id,
              workflowEvent: "APPROVAL_ASSIGNED",
            },
          },
        });

        await this.notificationProvider.notifyApprovalAssigned({
          quotationId: quotation.id,
          approvalId: newApproval.id,
          approverId: nextApprover.id,
          stage: nextStageDef.stage,
          stageName: nextStageDef.name,
        });

        const pendingDto: ApprovalRecordDto = {
          id: newApproval.id,
          quotationId: quotation.id,
          stage: newApproval.stage,
          status: newApproval.status,
          action: newApproval.action,
          comments: newApproval.comments,
          decidedAt: newApproval.decidedAt,
          createdAt: newApproval.createdAt,
          updatedAt: newApproval.updatedAt,
          approver: {
            id: nextApprover.id,
            email: nextApprover.email,
            firstName: nextApprover.firstName,
            lastName: nextApprover.lastName,
            role: nextApprover.role,
          },
        };

        return {
          quotationId: quotation.id,
          workflowStatus: "PENDING_APPROVAL",
          approvalLevel,
          currentStage: nextStageDef.stage,
          totalStages,
          pendingApproval: pendingDto,
          message: `Stage ${approval.stage} approved. Stage ${nextStageDef.stage} (${nextStageDef.name}) assigned.`,
          decisionTraceId: quotation.id,
        };
      }
    });
  }

  /**
   * Execute REJECT action. Immediately terminates workflow and rejects quotation.
   */
  async executeReject(params: {
    approval: any;
    quotation: any;
    approverId: string;
    comments: string;
    approvalLevel: string;
  }): Promise<WorkflowResult> {
    const { approval, quotation, approverId, comments, approvalLevel } = params;
    const totalStages = this.workflowService.getTotalStages(approvalLevel);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update approval record
      await tx.approval.update({
        where: { id: approval.id },
        data: {
          status: "REJECTED",
          action: "REJECT",
          comments,
          decidedAt: new Date(),
        },
      });

      // 2. Update quotation to REJECTED
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: "REJECTED",
          approvalState: "REJECTED",
        },
      });

      // 3. Write AuditLogs
      await tx.auditLog.create({
        data: {
          entity: "Approval",
          entityId: approval.id,
          action: "REJECT",
          userId: approverId,
          prevValue: { status: "PENDING" },
          newValue: { status: "REJECTED", action: "REJECT", comments },
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "Quotation",
          entityId: quotation.id,
          action: "UPDATE",
          userId: approverId,
          prevValue: { status: quotation.status, approvalState: quotation.approvalState },
          newValue: { status: "REJECTED", approvalState: "REJECTED", workflowEvent: "WORKFLOW_REJECTED" },
        },
      });

      await this.notificationProvider.notifyApprovalRejected({
        quotationId: quotation.id,
        approvalId: approval.id,
        quoteNumber: quotation.quoteNumber,
        rejectedBy: approverId,
        comments,
      });

      return {
        quotationId: quotation.id,
        workflowStatus: "REJECTED",
        approvalLevel,
        currentStage: null,
        totalStages,
        message: `Quotation rejected at stage ${approval.stage}. Workflow terminated.`,
        decisionTraceId: quotation.id,
      };
    });
  }

  /**
   * Execute RETURN for revision action. Sets quotation back to DRAFT for edits.
   */
  async executeReturnForRevision(params: {
    approval: any;
    quotation: any;
    approverId: string;
    comments: string;
    approvalLevel: string;
  }): Promise<WorkflowResult> {
    const { approval, quotation, approverId, comments, approvalLevel } = params;
    const totalStages = this.workflowService.getTotalStages(approvalLevel);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update approval record with REQUEST_CHANGES
      await tx.approval.update({
        where: { id: approval.id },
        data: {
          status: "REJECTED",
          action: "REQUEST_CHANGES",
          comments,
          decidedAt: new Date(),
        },
      });

      // 2. Return quotation to DRAFT
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: "DRAFT",
          approvalState: "PENDING",
        },
      });

      // 3. Write AuditLogs
      await tx.auditLog.create({
        data: {
          entity: "Approval",
          entityId: approval.id,
          action: "UPDATE",
          userId: approverId,
          prevValue: { status: "PENDING" },
          newValue: {
            status: "REJECTED",
            action: "REQUEST_CHANGES",
            comments,
            workflowEvent: "RETURNED_FOR_REVISION",
          },
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "Quotation",
          entityId: quotation.id,
          action: "UPDATE",
          userId: approverId,
          prevValue: { status: quotation.status },
          newValue: { status: "DRAFT", workflowEvent: "RETURNED_FOR_REVISION" },
        },
      });

      return {
        quotationId: quotation.id,
        workflowStatus: "DRAFT",
        approvalLevel,
        currentStage: null,
        totalStages,
        message: "Quotation returned for revision. Status reset to Draft.",
        decisionTraceId: quotation.id,
      };
    });
  }

  /**
   * Execute DELEGATE action. Reassigns the approval to another user.
   */
  async executeDelegate(params: {
    approval: any;
    quotation: any;
    currentApproverId: string;
    newApproverId: string;
    comments?: string;
  }): Promise<ApprovalRecordDto> {
    const { approval, quotation, currentApproverId, newApproverId, comments } = params;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.approval.update({
        where: { id: approval.id },
        data: {
          approverId: newApproverId,
          action: "ESCALATE",
          comments: comments ?? null,
        },
        include: {
          approver: {
            include: { role: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "Approval",
          entityId: approval.id,
          action: "UPDATE",
          userId: currentApproverId,
          prevValue: { approverId: currentApproverId },
          newValue: {
            approverId: newApproverId,
            action: "ESCALATE",
            comments: comments ?? null,
            workflowEvent: "APPROVAL_DELEGATED",
          },
        },
      });

      await this.notificationProvider.notifyApprovalAssigned({
        quotationId: quotation.id,
        approvalId: updated.id,
        approverId: newApproverId,
        stage: updated.stage,
        stageName: `Delegated Approval (Stage ${updated.stage})`,
      });

      return {
        id: updated.id,
        quotationId: updated.quotationId,
        stage: updated.stage,
        status: updated.status,
        action: updated.action,
        comments: updated.comments,
        decidedAt: updated.decidedAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        approver: {
          id: updated.approver.id,
          email: updated.approver.email,
          firstName: updated.approver.firstName,
          lastName: updated.approver.lastName,
          role: updated.approver.role.name,
        },
      };
    });
  }
}
