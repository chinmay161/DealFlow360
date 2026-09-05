/**
 * Approval Routing — DTO Schemas (Zod)
 *
 * Validates request bodies, path parameters, and query parameters.
 */

import { z } from "zod";

// ─── Path Parameters ─────────────────────────────────────────────────────────

export const QuotationIdParamSchema = z.object({
  quotationId: z.string().min(1, "quotationId is required"),
});
export type QuotationIdParam = z.infer<typeof QuotationIdParamSchema>;

export const ApprovalIdParamSchema = z.object({
  approvalId: z.string().min(1, "approvalId is required"),
});
export type ApprovalIdParam = z.infer<typeof ApprovalIdParamSchema>;

// ─── POST /api/v1/approvals/start ────────────────────────────────────────────

export const StartWorkflowSchema = z.object({
  quotationId: z.string().min(1, "quotationId is required"),
});
export type StartWorkflowDto = z.infer<typeof StartWorkflowSchema>;

// ─── POST /api/v1/approvals/:approvalId/approve ──────────────────────────────

export const ApproveActionSchema = z.object({
  comments: z.string().optional(),
  approverId: z.string().min(1, "approverId must not be empty").optional(),
});
export type ApproveActionDto = z.infer<typeof ApproveActionSchema>;

// ─── POST /api/v1/approvals/:approvalId/reject ───────────────────────────────

export const RejectActionSchema = z.object({
  comments: z.string().min(1, "Rejection comments are required"),
  approverId: z.string().min(1, "approverId must not be empty").optional(),
});
export type RejectActionDto = z.infer<typeof RejectActionSchema>;

// ─── POST /api/v1/approvals/:approvalId/return ───────────────────────────────

export const ReturnActionSchema = z.object({
  comments: z.string().min(1, "Comments explaining required revisions are required"),
  approverId: z.string().min(1, "approverId must not be empty").optional(),
});
export type ReturnActionDto = z.infer<typeof ReturnActionSchema>;

// ─── POST /api/v1/approvals/:approvalId/delegate ─────────────────────────────

export const DelegateActionSchema = z.object({
  newApproverId: z.string().min(1, "newApproverId is required"),
  approverId: z.string().min(1, "approverId must not be empty").optional(),
  comments: z.string().optional(),
});
export type DelegateActionDto = z.infer<typeof DelegateActionSchema>;

// ─── GET /api/v1/approvals/pending ───────────────────────────────────────────

export const PendingApprovalsQuerySchema = z.object({
  role: z.enum(["ADMIN", "SALES_REP", "MANAGER", "FINANCE", "CUSTOMER"]).optional(),
  userId: z.string().optional(),
  user: z.string().optional(), // alias for userId
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ESCALATED"]).optional(),
});
export type PendingApprovalsQueryDto = z.infer<typeof PendingApprovalsQuerySchema>;
