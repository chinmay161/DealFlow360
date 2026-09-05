import { useQuery } from "@tanstack/react-query";
import { fetchWarehouses, fetchWarehouseDetails } from "../services/warehouse.service";

export function useWarehouses() {
  return useQuery({
    queryKey: ["inventory", "warehouses"],
    queryFn: () => fetchWarehouses(),
    staleTime: 60_000,
  });
}

export function useWarehouseDetails(warehouseId: string | null) {
  return useQuery({
    queryKey: ["inventory", "warehouse", warehouseId],
    queryFn: () => (warehouseId ? fetchWarehouseDetails(warehouseId) : null),
    enabled: Boolean(warehouseId),
    staleTime: 30_000,
  });
}
