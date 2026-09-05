/**
 * Approval Routing — Domain Types & Enums
 */

import type {
  ApprovalStatus,
  QuotationStatus,
} from "@prisma/client";

export type RoleType = "SALES_REP" | "SALES_MANAGER" | "FINANCE_MANAGER" | "VP_SALES" | "ADMIN" | "LEGAL" | "OPERATIONS" | string;
export type ApprovalAction = "APPROVE" | "REJECT" | "ESCALATE" | "REQUEST_CHANGE" | string;
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "ESCALATE" | string;

export type {
  ApprovalStatus,
  QuotationStatus,
};

export type WorkflowStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type ApprovalLevelType =
  | "AUTO"
  | "AUTO_APPROVE"
  | "MANAGER"
  | "FINANCE"
  | "EXECUTIVE"
  | "REJECT";

/**
 * Definition of an individual stage in an approval chain.
 */
export interface StageDefinition {
  stage: number;
  role: RoleType;
  name: string;
  description?: string;
}

/**
 * Basic user information for an assigned approver.
 */
export interface ApproverUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleType;
}

/**
 * Clean data transfer representation of an Approval record.
 */
export interface ApprovalRecordDto {
  id: string;
  quotationId: string;
  stage: number;
  status: ApprovalStatus;
  action: ApprovalAction | null;
  comments: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  approver: ApproverUserInfo;
}

/**
 * Result returned upon starting or progressing a workflow.
 */
export interface WorkflowResult {
  quotationId: string;
  workflowStatus: WorkflowStatus;
  approvalLevel: string;
  currentStage: number | null;
  totalStages: number;
  pendingApproval?: ApprovalRecordDto | null;
  message: string;
  decisionTraceId: string;
}

/**
 * Detailed timeline entry in the approval history.
 */
export interface ApprovalHistoryEntry {
  id: string;
  stage: number;
  status: ApprovalStatus;
  action: ApprovalAction | null;
  comments: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  approver: ApproverUserInfo;
}

/**
 * Comprehensive workflow status for a quotation.
 */
export interface WorkflowStatusResponse {
  quotationId: string;
  quoteNumber: string;
  workflowStatus: WorkflowStatus;
  approvalLevel: string;
  currentStage: number | null;
  totalStages: number;
  pendingApprover: ApproverUserInfo | null;
  completedApprovals: ApprovalRecordDto[];
  history: ApprovalHistoryEntry[];
  decisionTraceId: string;
  whyApprovalRequired?: string;
}

/**
 * Filtering criteria for pending approvals.
 */
export interface PendingApprovalsFilter {
  role?: RoleType;
  userId?: string;
  status?: ApprovalStatus;
}
