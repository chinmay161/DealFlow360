import { useQuery } from "@tanstack/react-query";
import { managerAnalyticsService } from "../services/analytics.service";
import type { ManagerAnalyticsData } from "../types/manager.types";

export function useManagerAnalytics(timeframe: string = "30D") {
  return useQuery<ManagerAnalyticsData>({
    queryKey: ["manager", "analytics", timeframe],
    queryFn: () => managerAnalyticsService.getAnalytics(timeframe),
    staleTime: 60_000,
  });
}
