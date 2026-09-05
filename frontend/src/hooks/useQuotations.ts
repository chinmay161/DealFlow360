import { useQuery } from "@tanstack/react-query";
import { quotationService } from "@/services/quotation.service";
import type { QuotationFilterParams } from "@/types/quotation.types";

export const QUOTATIONS_QUERY_KEY = ["quotations"];

export function useQuotations(filters: QuotationFilterParams = {}) {
  return useQuery({
    queryKey: [...QUOTATIONS_QUERY_KEY, filters],
    queryFn: () => quotationService.getQuotations(filters),
    staleTime: 30_000,
  });
}
