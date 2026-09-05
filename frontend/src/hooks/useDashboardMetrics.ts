import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export const DASHBOARD_METRICS_QUERY_KEY = ["dashboard-metrics"];

export function useDashboardMetrics() {
  return useQuery({
    queryKey: DASHBOARD_METRICS_QUERY_KEY,
    queryFn: () => dashboardService.getDashboardMetrics(),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
