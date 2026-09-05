import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationService } from "@/services/quotation.service";
import { QUOTATIONS_QUERY_KEY } from "./useQuotations";
import type { CreateQuotationInput } from "@/types/quotation.types";
import type { TransitionPayload } from "@/types/approval.types";

export const quotationDetailQueryKey = (id: string) => ["quotation", id];
export const quotationHistoryQueryKey = (id: string) => ["quotation-history", id];

export function useQuotationDetail(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: quotationDetailQueryKey(id),
    queryFn: () => quotationService.getQuotationById(id),
    enabled: Boolean(id),
  });

  const historyQuery = useQuery({
    queryKey: quotationHistoryQueryKey(id),
    queryFn: () => quotationService.getQuotationHistory(id),
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateQuotationInput>) =>
      quotationService.updateQuotation(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(quotationDetailQueryKey(id), updated);
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: (payload: TransitionPayload) =>
      quotationService.transitionQuotation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationDetailQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: quotationHistoryQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });

  return {
    ...query,
    history: historyQuery.data ?? [],
    isHistoryLoading: historyQuery.isLoading,
    updateQuote: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    transitionQuote: transitionMutation.mutateAsync,
    isTransitioning: transitionMutation.isPending,
  };
}
