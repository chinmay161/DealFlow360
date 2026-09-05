import { apiClient } from "@/services/api-client";
import type { PaginatedAuditResponse } from "../types/manager.types";

export interface GetAuditParams {
  page?: number;
  pageSize?: number;
  search?: string;
  entity?: string;
  action?: string;
}

export const managerAuditService = {
  /**
   * Fetch paginated audit logs with search and filtering
   */
  async getAuditLogs(params?: GetAuditParams): Promise<PaginatedAuditResponse> {
    return apiClient<PaginatedAuditResponse>("/api/manager/audit", {
      params: params as any,
    });
  },
};
