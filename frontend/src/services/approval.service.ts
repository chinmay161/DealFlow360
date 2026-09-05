import { apiClient } from "./api-client";
import type { QuotationWorkflowStatus } from "@/types/approval.types";

export const approvalService = {
  /**
   * Get live workflow status and steps for a quotation
   */
  async getWorkflowStatus(quotationId: string): Promise<QuotationWorkflowStatus> {
    return apiClient<QuotationWorkflowStatus>(`/api/approvals/quotation/${encodeURIComponent(quotationId)}`);
  },

  /**
   * Initiate approval workflow for a quotation
   */
  async startWorkflow(quotationId: string): Promise<{ success: boolean; workflowId: string }> {
    return apiClient<{ success: boolean; workflowId: string }>("/api/approvals/start", {
      method: "POST",
      body: JSON.stringify({ quotationId }),
    });
  },

  /**
   * Approve a workflow step
   */
  async approve(approvalId: string, comments?: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/approvals/${encodeURIComponent(approvalId)}/approve`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    });
  },

  /**
   * Reject a workflow step
   */
  async reject(approvalId: string, comments?: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/approvals/${encodeURIComponent(approvalId)}/reject`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    });
  },

  /**
   * Return quotation for revision
   */
  async returnForRevision(approvalId: string, comments?: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/approvals/${encodeURIComponent(approvalId)}/return`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    });
  },
};
