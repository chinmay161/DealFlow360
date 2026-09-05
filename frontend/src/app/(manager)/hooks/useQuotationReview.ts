import { useQuery } from "@tanstack/react-query";
import { managerQuotationService } from "../services/quotation.service";
import type { QuotationReviewDetails } from "../types/manager.types";

export function useQuotationReview(id: string) {
  return useQuery<QuotationReviewDetails>({
    queryKey: ["manager", "quotation", id],
    queryFn: () => managerQuotationService.getQuotationReviewDetails(id),
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}
