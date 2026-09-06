import { apiClient } from "@/services/api-client";
import type { ApprovalItem } from "../types/manager.types";

export interface GetApprovalsParams {
  search?: string;
  risk?: string;
  status?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const managerApprovalService = {
  /**
   * Fetch approval queue items for Manager review
   */
  async getApprovalQueue(params?: GetApprovalsParams): Promise<{ items: ApprovalItem[]; totalCount: number }> {
    return apiClient<{ items: ApprovalItem[]; totalCount: number }>("/api/manager/approvals", {
      params: params as any,
    });
  },

  /**
   * Approve a workflow step
   */
  async approve(approvalId: string, comments?: string): Promise<{ success: boolean; message?: string }> {
    return apiClient<{ success: boolean; message?: string }>(`/api/approvals/${encodeURIComponent(approvalId)}/approve`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    });
  },

  /**
   * Reject a workflow step
   */
  async reject(approvalId: string, comments: string): Promise<{ success: boolean; message?: string }> {
    return apiClient<{ success: boolean; message?: string }>(`/api/approvals/${encodeURIComponent(approvalId)}/reject`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    });
  },

  /**
   * Return quotation for revision
   */
  async returnForRevision(approvalId: string, comments: string): Promise<{ success: boolean; message?: string }> {
    return apiClient<{ success: boolean; message?: string }>(`/api/approvals/${encodeURIComponent(approvalId)}/return`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    });
  },

  /**
   * Request more information from sales executive
   */
  async requestMoreInfo(approvalId: string, query: string): Promise<{ success: boolean; message?: string }> {
    return apiClient<{ success: boolean; message?: string }>(`/api/approvals/${encodeURIComponent(approvalId)}/request-info`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },
};
