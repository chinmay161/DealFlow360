import { useQuery } from "@tanstack/react-query";
import { fetchReservations } from "../services/reservation.service";

export function useReservations(params: {
  search?: string;
  warehouse?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["inventory", "reservations", params],
    queryFn: () => fetchReservations(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
