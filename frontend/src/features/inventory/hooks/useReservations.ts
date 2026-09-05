import { useQuery } from "@tanstack/react-query";
import {
  fetchReservations,
  fetchReservationById,
  type ReservationQueryParams,
} from "../services/reservation.service";

export function useReservations(params: ReservationQueryParams = {}) {
  return useQuery({
    queryKey: ["inventory", "reservations", params],
    queryFn: () => fetchReservations(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useReservationById(id: string | null) {
  return useQuery({
    queryKey: ["inventory", "reservation", id],
    queryFn: () => (id ? fetchReservationById(id) : null),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

