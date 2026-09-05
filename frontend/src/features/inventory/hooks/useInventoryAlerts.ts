import { useQuery } from "@tanstack/react-query";
import { fetchInventoryAlerts, fetchInventoryInsights } from "../services/inventory.service";

export function useInventoryAlerts() {
  return useQuery({
    queryKey: ["inventory", "alerts"],
    queryFn: () => fetchInventoryAlerts(),
    staleTime: 30_000,
  });
}

export function useInventoryInsights() {
  return useQuery({
    queryKey: ["inventory", "insights"],
    queryFn: () => fetchInventoryInsights(),
    staleTime: 60_000,
  });
}
