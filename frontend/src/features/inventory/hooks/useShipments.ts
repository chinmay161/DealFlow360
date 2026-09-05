import { useQuery } from "@tanstack/react-query";
import { fetchShipments } from "../services/shipment.service";

export function useShipments(params: {
  search?: string;
  warehouse?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["inventory", "shipments", params],
    queryFn: () => fetchShipments(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
