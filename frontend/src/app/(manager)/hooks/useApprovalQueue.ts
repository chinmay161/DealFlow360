import { useQuery } from "@tanstack/react-query";
import { managerApprovalService, GetApprovalsParams } from "../services/approval.service";
import type { ApprovalItem } from "../types/manager.types";

export function useApprovalQueue(params?: GetApprovalsParams) {
  return useQuery<{ items: ApprovalItem[]; totalCount: number }>({
    queryKey: ["manager", "approvals", params],
    queryFn: () => managerApprovalService.getApprovalQueue(params),
    staleTime: 15_000,
  });
}
