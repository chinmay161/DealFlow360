import { useQuery } from "@tanstack/react-query";
import { validateQuoteStock } from "../services/inventory.service";

export function useQuoteStock(options: { quotationId?: string; productId?: string; quantity?: number }) {
  const isEnabled = Boolean(options.quotationId || (options.productId && options.quantity));
  return useQuery({
    queryKey: ["inventory", "quote-stock", options],
    queryFn: () => validateQuoteStock(options),
    enabled: isEnabled,
    staleTime: 10_000,
  });
}
