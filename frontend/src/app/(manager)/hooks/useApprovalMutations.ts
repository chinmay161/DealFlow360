import { useMutation, useQueryClient } from "@tanstack/react-query";
import { managerApprovalService } from "../services/approval.service";
import { useToast } from "@/components/providers/ToastProvider";

export function useApprovalMutations() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const approveMutation = useMutation({
    mutationFn: ({ approvalId, comments }: { approvalId: string; comments?: string }) =>
      managerApprovalService.approve(approvalId, comments),
    onSuccess: () => {
      success("Quotation Approved", "The commercial approval was successfully recorded.");
      queryClient.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (err: any) => {
      error("Approval Failed", err.message || "Failed to process quotation approval.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ approvalId, comments }: { approvalId: string; comments: string }) =>
      managerApprovalService.reject(approvalId, comments),
    onSuccess: () => {
      success("Quotation Rejected", "Rejection notice logged and workflow halted.");
      queryClient.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (err: any) => {
      error("Rejection Failed", err.message || "Failed to process quotation rejection.");
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ approvalId, comments }: { approvalId: string; comments: string }) =>
      managerApprovalService.returnForRevision(approvalId, comments),
    onSuccess: () => {
      success("Returned for Revision", "Sales representative notified with revision comments.");
      queryClient.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (err: any) => {
      error("Action Failed", err.message || "Failed to return quotation for revision.");
    },
  });

  const requestInfoMutation = useMutation({
    mutationFn: ({ approvalId, query }: { approvalId: string; query: string }) =>
      managerApprovalService.requestMoreInfo(approvalId, query),
    onSuccess: () => {
      success("Information Requested", "Clarification inquiry dispatched to the deal owner.");
      queryClient.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (err: any) => {
      error("Action Failed", err.message || "Failed to send information request.");
    },
  });

  return {
    approveMutation,
    rejectMutation,
    returnMutation,
    requestInfoMutation,
  };
}
