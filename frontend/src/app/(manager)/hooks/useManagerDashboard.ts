import { useQuery } from "@tanstack/react-query";
import { managerDashboardService } from "../services/dashboard.service";
import type { ManagerDashboardData } from "../types/manager.types";

export function useManagerDashboard() {
  return useQuery<ManagerDashboardData>({
    queryKey: ["manager", "dashboard"],
    queryFn: () => managerDashboardService.getDashboardData(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
