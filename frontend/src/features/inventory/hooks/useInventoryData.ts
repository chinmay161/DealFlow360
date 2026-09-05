import { useQuery } from "@tanstack/react-query";
import { fetchInventoryOverview, fetchInventoryItems } from "../services/inventory.service";
import type { InventoryFilterParams } from "../types/inventory.types";

export function useInventoryOverview() {
  return useQuery({
    queryKey: ["inventory", "overview"],
    queryFn: () => fetchInventoryOverview(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryItems(params: InventoryFilterParams = {}) {
  return useQuery({
    queryKey: ["inventory", "items", params],
    queryFn: () => fetchInventoryItems(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
