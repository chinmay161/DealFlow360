import { useQuery } from "@tanstack/react-query";
import {
  fetchShipments,
  fetchShipmentById,
  type ShipmentQueryParams,
} from "../services/shipment.service";

export function useShipments(params: ShipmentQueryParams = {}) {
  return useQuery({
    queryKey: ["inventory", "shipments", params],
    queryFn: () => fetchShipments(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useShipmentById(idOrNumber: string | null) {
  return useQuery({
    queryKey: ["inventory", "shipment", idOrNumber],
    queryFn: () => (idOrNumber ? fetchShipmentById(idOrNumber) : null),
    enabled: Boolean(idOrNumber),
    staleTime: 30_000,
  });
}

