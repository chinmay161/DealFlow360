import { useQuery } from "@tanstack/react-query";
import { managerAuditService, GetAuditParams } from "../services/audit.service";
import type { PaginatedAuditResponse } from "../types/manager.types";

export function useAuditLogs(params?: GetAuditParams) {
  return useQuery<PaginatedAuditResponse>({
    queryKey: ["manager", "audit", params],
    queryFn: () => managerAuditService.getAuditLogs(params),
    staleTime: 30_000,
  });
}
