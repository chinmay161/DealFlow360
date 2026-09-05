import { useQuery } from "@tanstack/react-query";
import { fetchInventoryTrends } from "../services/inventory.service";

export function useInventoryTrends(range = "30D") {
  return useQuery({
    queryKey: ["inventory", "trends", range],
    queryFn: () => fetchInventoryTrends(range),
    staleTime: 60_000,
  });
}
