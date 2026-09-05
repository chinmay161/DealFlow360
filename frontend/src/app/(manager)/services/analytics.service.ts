import { apiClient } from "@/services/api-client";
import type { ManagerAnalyticsData } from "../types/manager.types";

export const managerAnalyticsService = {
  /**
   * Fetch manager analytics breakdown across timeframes
   */
  async getAnalytics(timeframe: string = "30D"): Promise<ManagerAnalyticsData> {
    return apiClient<ManagerAnalyticsData>("/api/manager/analytics", {
      params: { timeframe },
    });
  },
};
