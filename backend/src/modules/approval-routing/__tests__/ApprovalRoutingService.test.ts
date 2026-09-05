/**
 * ApprovalRoutingService — Unit Tests
 *
 * Tests the complete approval lifecycle, multi-stage transitions, validations,
 * notifications, and audit logging with a mocked Prisma client.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ApprovalRoutingService } from "../services/ApprovalRoutingService.js";
import { MockNotificationProvider } from "../interfaces/NotificationProvider.js";
import {
  QuotationNotFoundError,
  ApprovalNotFoundError,
  ApprovalAlreadyCompletedError,
  UnauthorizedApproverError,
  SkippedStageError,
  InvalidWorkflowTransitionError,
} from "../utils/errors.js";
import {
  createMockPrisma,
  mockQuotation,
  mockUser,
  mockFinanceUser,
  mockAdminUser,
  mockApproval,
} from "./helpers.js";

describe("ApprovalRoutingService", () => {
  let mockPrisma: any;
  let notifications: MockNotificationProvider;
  let service: ApprovalRoutingService;

  beforeEach(() => {
    mockPrisma = createMockPrisma({
      quotations: [
        mockQuotation({ id: "quot-1", quoteNumber: "QT-001", status: "DRAFT" }),
      ],
      users: [
        mockUser({ id: "mgr-1", email: "mgr@test.com" }),
        mockFinanceUser({ id: "fin-1", email: "fin@test.com" }),
        mockAdminUser({ id: "admin-1", email: "admin@test.com" }),
      ],
      approvals: [],
      auditLogs: [],
    });

    notifications = new MockNotificationProvider();
    service = new ApprovalRoutingService(mockPrisma, {
      notificationProvider: notifications,
    });
  });

  // ─── 1. Auto Approval ───────────────────────────────────────────────────────

  describe("Auto Approval", () => {
    it("immediately approves quotation without creating approval rows", async () => {
      const result = await service.startWorkflow("quot-1", {
        approvalLevel: "AUTO",
      });

      expect(result.workflowStatus).toBe("APPROVED");
      expect(result.currentStage).toBeNull();
      expect(result.totalStages).toBe(0);
      expect(result.pendingApproval).toBeUndefined();

      // Quotation in DB should be APPROVED
      const quotation = await mockPrisma.quotation.findUnique({ where: { id: "quot-1" } });
      expect(quotation.status).toBe("APPROVED");
      expect(quotation.approvalState).toBe("APPROVED");

      // No approval rows created
      const approvals = await mockPrisma.approval.findMany({ where: { quotationId: "quot-1" } });
      expect(approvals).toHaveLength(0);

      // AuditLog recorded
      const logs = await mockPrisma.auditLog.findMany({ where: { entityId: "quot-1" } });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].action).toBe("UPDATE");

      // Notification sent
      expect(notifications.completedEvents).toHaveLength(1);
      expect(notifications.completedEvents[0].quotationId).toBe("quot-1");
    });
  });

  // ─── 2. Manager Approval (Single Stage) ─────────────────────────────────────

  describe("Manager Approval (1 Stage)", () => {
    it("creates stage 1 approval and progresses to APPROVED when manager approves", async () => {
      // 1. Start workflow
      const startResult = await service.startWorkflow("quot-1", {
        approvalLevel: "MANAGER",
      });

      expect(startResult.workflowStatus).toBe("PENDING_APPROVAL");
      expect(startResult.currentStage).toBe(1);
      expect(startResult.totalStages).toBe(1);
      expect(startResult.pendingApproval).toBeDefined();
      expect(startResult.pendingApproval?.stage).toBe(1);
      expect(startResult.pendingApproval?.approver.role).toBe("MANAGER");

      const approvalId = startResult.pendingApproval!.id;

      // Notification dispatched for stage 1
      expect(notifications.assignedEvents).toHaveLength(1);
      expect(notifications.assignedEvents[0].stage).toBe(1);

      // 2. Manager approves
      const approveResult = await service.approve(
        approvalId,
        startResult.pendingApproval!.approver.id,
        "Commercial terms look acceptable.",
      );

      expect(approveResult.workflowStatus).toBe("APPROVED");
      expect(approveResult.currentStage).toBeNull();
      expect(approveResult.totalStages).toBe(1);

      // Quotation should be marked APPROVED
      const quotation = await mockPrisma.quotation.findUnique({ where: { id: "quot-1" } });
      expect(quotation.status).toBe("APPROVED");
      expect(quotation.approvalState).toBe("APPROVED");

      // Approval row updated
      const approval = await mockPrisma.approval.findUnique({ where: { id: approvalId } });
      expect(approval.status).toBe("APPROVED");
      expect(approval.action).toBe("APPROVE");
      expect(approval.comments).toBe("Commercial terms look acceptable.");
      expect(approval.decidedAt).toBeDefined();

      // Completion notification fired
      expect(notifications.completedEvents).toHaveLength(1);
    });
  });

  // ─── 3. Multi-Stage Workflow (FINANCE: Manager -> Finance) ──────────────────

  describe("Finance Approval (2-Stage Workflow)", () => {
    it("orchestrates Manager -> Finance progression seamlessly", async () => {
      // 1. Start workflow
      const startResult = await service.startWorkflow("quot-1", {
        approvalLevel: "FINANCE",
      });

      expect(startResult.currentStage).toBe(1);
      expect(startResult.totalStages).toBe(2);
      expect(startResult.pendingApproval?.stage).toBe(1);

      const stage1ApprovalId = startResult.pendingApproval!.id;
      const managerId = startResult.pendingApproval!.approver.id;

      // 2. Manager approves Stage 1
      const stage1Result = await service.approve(
        stage1ApprovalId,
        managerId,
        "Manager approved, escalating to finance",
      );

      expect(stage1Result.workflowStatus).toBe("PENDING_APPROVAL");
      expect(stage1Result.currentStage).toBe(2);
      expect(stage1Result.totalStages).toBe(2);
      expect(stage1Result.pendingApproval).toBeDefined();
      expect(stage1Result.pendingApproval?.stage).toBe(2);
      expect(stage1Result.pendingApproval?.approver.role).toBe("FINANCE");

      const stage2ApprovalId = stage1Result.pendingApproval!.id;
      const financeUserId = stage1Result.pendingApproval!.approver.id;

      // Stage 2 notification assigned
      expect(notifications.assignedEvents).toHaveLength(2);
      expect(notifications.assignedEvents[1].stage).toBe(2);

      // Quotation is still PENDING_APPROVAL
      let quotation = await mockPrisma.quotation.findUnique({ where: { id: "quot-1" } });
      expect(quotation.status).toBe("PENDING_APPROVAL");

      // 3. Finance approves Stage 2 (Final Stage)
      const stage2Result = await service.approve(
        stage2ApprovalId,
        financeUserId,
        "Margin threshold verified and approved by finance",
      );

      expect(stage2Result.workflowStatus).toBe("APPROVED");
      expect(stage2Result.currentStage).toBeNull();

      // Quotation is now APPROVED
      quotation = await mockPrisma.quotation.findUnique({ where: { id: "quot-1" } });
      expect(quotation.status).toBe("APPROVED");
      expect(quotation.approvalState).toBe("APPROVED");

      // Total 2 approvals in DB, both APPROVED
      const allApprovals = await mockPrisma.approval.findMany({ where: { quotationId: "quot-1" } });
      expect(allApprovals).toHaveLength(2);
      expect(allApprovals.every((a: any) => a.status === "APPROVED")).toBe(true);

      // Completion notification sent
      expect(notifications.completedEvents).toHaveLength(1);
    });
  });

  // ─── 4. Rejection ───────────────────────────────────────────────────────────

  describe("Rejection", () => {
    it("terminates workflow when rejected by approver", async () => {
      const startResult = await service.startWorkflow("quot-1", {
        approvalLevel: "MANAGER",
      });

      const approvalId = startResult.pendingApproval!.id;
      const approverId = startResult.pendingApproval!.approver.id;

      const rejectResult = await service.reject(
        approvalId,
        approverId,
        "Discount is unacceptable for this product category.",
      );

      expect(rejectResult.workflowStatus).toBe("REJECTED");
      expect(rejectResult.currentStage).toBeNull();

      // Quotation should be REJECTED
      const quotation = await mockPrisma.quotation.findUnique({ where: { id: "quot-1" } });
      expect(quotation.status).toBe("REJECTED");
      expect(quotation.approvalState).toBe("REJECTED");

      // Approval row marked REJECTED
      const approval = await mockPrisma.approval.findUnique({ where: { id: approvalId } });
      expect(approval.status).toBe("REJECTED");
      expect(approval.action).toBe("REJECT");
      expect(approval.comments).toContain("Discount is unacceptable");

      // Notification sent
      expect(notifications.rejectedEvents).toHaveLength(1);
      expect(notifications.rejectedEvents[0].comments).toContain("Discount is unacceptable");
    });

    it("terminates immediately when rule engine determines REJECT", async () => {
      const result = await service.startWorkflow("quot-1", {
        approvalLevel: "REJECT",
      });

      expect(result.workflowStatus).toBe("REJECTED");

      const quotation = await mockPrisma.quotation.findUnique({ where: { id: "quot-1" } });
      expect(quotation.status).toBe("REJECTED");

      const approvals = await mockPrisma.approval.findMany({ where: { quotationId: "quot-1" } });
      expect(approvals).toHaveLength(0);
    });
  });

  // ─── 5. Return for Revision ─────────────────────────────────────────────────

  describe("Return for Revision", () => {
    it("resets quotation to DRAFT when requested by approver", async () => {
      const startResult = await service.startWorkflow("quot-1", {
        approvalLevel: "MANAGER",
      });

      const approvalId = startResult.pendingApproval!.id;
      const approverId = startResult.pendingApproval!.approver.id;

      const returnResult = await service.returnForRevision(
        approvalId,
        approverId,
        "Please reduce the quantity discount on line 2.",
      );

      expect(returnResult.workflowStatus).toBe("DRAFT");
      expect(returnResult.currentStage).toBeNull();

      // Quotation status is reset to DRAFT
      const quotation = await mockPrisma.quotation.findUnique({ where: { id: "quot-1" } });
      expect(quotation.status).toBe("DRAFT");

      // Approval action is REQUEST_CHANGES
      const approval = await mockPrisma.approval.findUnique({ where: { id: approvalId } });
      expect(approval.action).toBe("REQUEST_CHANGES");
      expect(approval.comments).toBe("Please reduce the quantity discount on line 2.");
    });
  });

  // ─── 6. Validations & Error Handling ────────────────────────────────────────

  describe("Validation Rules", () => {
    it("prevents approving an already completed approval (409)", async () => {
      const startResult = await service.startWorkflow("quot-1", {
        approvalLevel: "MANAGER",
      });
      const approvalId = startResult.pendingApproval!.id;
      const approverId = startResult.pendingApproval!.approver.id;

      // First approval succeeds
      await service.approve(approvalId, approverId);

      // Second approval attempt throws 409
      await expect(service.approve(approvalId, approverId)).rejects.toThrow(
        ApprovalAlreadyCompletedError,
      );
    });

    it("prevents an unauthorized approver from acting (403)", async () => {
      const startResult = await service.startWorkflow("quot-1", {
        approvalLevel: "MANAGER",
      });
      const approvalId = startResult.pendingApproval!.id;

      // Another user attempts to approve
      await expect(service.approve(approvalId, "wrong-user-999")).rejects.toThrow(
        UnauthorizedApproverError,
      );
    });

    it("prevents skipped stages (422)", async () => {
      // Seed quotation with an existing unapproved stage 1 and a stage 2 row
      const stage1 = mockApproval({
        id: "appr-stage-1",
        stage: 1,
        status: "PENDING",
        quotationId: "quot-1",
        approverId: "mgr-1",
      });
      const stage2 = mockApproval({
        id: "appr-stage-2",
        stage: 2,
        status: "PENDING",
        quotationId: "quot-1",
        approverId: "fin-1",
      });

      mockPrisma._state.approvals.push(stage1, stage2);

      // Attempting to approve stage 2 while stage 1 is PENDING throws SkippedStageError
      await expect(service.approve("appr-stage-2", "fin-1")).rejects.toThrow(
        SkippedStageError,
      );
    });

    it("prevents starting workflow on an already approved quotation (422)", async () => {
      await mockPrisma.quotation.update({
        where: { id: "quot-1" },
        data: { status: "APPROVED" },
      });

      await expect(service.startWorkflow("quot-1")).rejects.toThrow(
        InvalidWorkflowTransitionError,
      );
    });

    it("throws QuotationNotFoundError when quotation does not exist (404)", async () => {
      await expect(service.startWorkflow("non-existent-quot")).rejects.toThrow(
        QuotationNotFoundError,
      );
    });

    it("throws ApprovalNotFoundError when approval does not exist (404)", async () => {
      await expect(service.approve("non-existent-appr", "mgr-1")).rejects.toThrow(
        ApprovalNotFoundError,
      );
    });
  });

  // ─── 7. Delegation ──────────────────────────────────────────────────────────

  describe("Delegation", () => {
    it("delegates approval to another eligible user", async () => {
      const startResult = await service.startWorkflow("quot-1", {
        approvalLevel: "MANAGER",
      });
      const approvalId = startResult.pendingApproval!.id;
      const currentApproverId = startResult.pendingApproval!.approver.id;

      // Delegate to another manager
      const delegated = await service.delegate(
        approvalId,
        currentApproverId,
        "fin-1",
        "Delegating to finance lead while on leave",
      );

      expect(delegated.approver.id).toBe("fin-1");
      expect(delegated.action).toBe("ESCALATE");
    });
  });

  // ─── 8. Status & History ────────────────────────────────────────────────────

  describe("getWorkflowStatus", () => {
    it("returns comprehensive status and history", async () => {
      await service.startWorkflow("quot-1", { approvalLevel: "MANAGER" });

      const status = await service.getWorkflowStatus("quot-1");

      expect(status.quotationId).toBe("quot-1");
      expect(status.quoteNumber).toBe("QT-001");
      expect(status.workflowStatus).toBe("PENDING_APPROVAL");
      expect(status.currentStage).toBe(1);
      expect(status.totalStages).toBe(1);
      expect(status.pendingApprover).toBeDefined();
      expect(status.pendingApprover?.role).toBe("MANAGER");
      expect(status.history).toHaveLength(1);
      expect(status.decisionTraceId).toBe("quot-1");
    });
  });

  // ─── 9. Pending Approvals ───────────────────────────────────────────────────

  describe("getPendingApprovals", () => {
    it("retrieves and filters pending approvals by role and user", async () => {
      await service.startWorkflow("quot-1", { approvalLevel: "MANAGER" });

      // Query by role
      const managerApprovals = await service.getPendingApprovals({ role: "MANAGER" });
      expect(managerApprovals).toHaveLength(1);
      expect(managerApprovals[0].approver.role).toBe("MANAGER");

      // Query by role with no matches
      const financeApprovals = await service.getPendingApprovals({ role: "FINANCE" });
      expect(financeApprovals).toHaveLength(0);

      // Query by user
      const userApprovals = await service.getPendingApprovals({ userId: "mgr-1" });
      expect(userApprovals).toHaveLength(1);
    });
  });
});
