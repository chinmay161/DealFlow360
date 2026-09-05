import { apiClient } from "@/services/api-client";
import type { ManagerDashboardData } from "../types/manager.types";

export const managerDashboardService = {
  /**
   * Fetch comprehensive metrics, trends, and recent queue for Manager Dashboard
   */
  async getDashboardData(): Promise<ManagerDashboardData> {
    return apiClient<ManagerDashboardData>("/api/manager/dashboard");
  },
};
