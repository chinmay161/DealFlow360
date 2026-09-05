import type { ReservationRecord, PaginatedResponse } from "../types/inventory.types";

export async function fetchReservations(
  params: {
    search?: string;
    warehouse?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<PaginatedResponse<ReservationRecord>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.warehouse && params.warehouse !== "ALL") query.set("warehouse", params.warehouse);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`/api/inventory/reservations?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch reservations");
  }
  return res.json();
}
