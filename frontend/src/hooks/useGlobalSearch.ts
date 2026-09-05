import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { useDebounce } from "./useDebounce";

export interface GlobalSearchResultItem {
  id: string;
  type: "quotation" | "product" | "customer";
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
}

export interface GlobalSearchResponse {
  results: GlobalSearchResultItem[];
}

export function useGlobalSearch(query: string) {
  const debouncedQuery = useDebounce(query, 250);

  return useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () =>
      apiClient<GlobalSearchResponse>("/api/search", {
        params: { q: debouncedQuery },
      }),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 60_000,
  });
}
