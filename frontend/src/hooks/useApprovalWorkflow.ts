import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalService } from "@/services/approval.service";
import { quotationDetailQueryKey } from "./useQuotationDetail";
import { QUOTATIONS_QUERY_KEY } from "./useQuotations";

export const approvalWorkflowQueryKey = (quotationId: string) => ["approval-workflow", quotationId];

export function useApprovalWorkflow(quotationId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: approvalWorkflowQueryKey(quotationId),
    queryFn: () => approvalService.getWorkflowStatus(quotationId),
    enabled: Boolean(quotationId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: approvalWorkflowQueryKey(quotationId) });
    queryClient.invalidateQueries({ queryKey: quotationDetailQueryKey(quotationId) });
    queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ approvalId, comments }: { approvalId: string; comments?: string }) =>
      approvalService.approve(approvalId, comments),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ approvalId, comments }: { approvalId: string; comments?: string }) =>
      approvalService.reject(approvalId, comments),
    onSuccess: invalidate,
  });

  const returnMutation = useMutation({
    mutationFn: ({ approvalId, comments }: { approvalId: string; comments?: string }) =>
      approvalService.returnForRevision(approvalId, comments),
    onSuccess: invalidate,
  });

  return {
    ...query,
    approve: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    reject: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    returnForRevision: returnMutation.mutateAsync,
    isReturning: returnMutation.isPending,
  };
}
