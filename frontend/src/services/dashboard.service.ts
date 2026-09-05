import { apiClient } from "./api-client";
import type { DashboardMetricsResponse } from "@/types/dashboard.types";

export const dashboardService = {
  /**
   * Fetch complete dashboard KPIs, distribution charts, trends, and recent activity
   */
  async getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    return apiClient<DashboardMetricsResponse>("/api/dashboard/metrics");
  },
};
