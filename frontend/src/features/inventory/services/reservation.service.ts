import type { ReservationRecord, PaginatedResponse } from "../types/inventory.types";

export interface ReservationQueryParams {
  search?: string;
  warehouse?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function fetchReservations(
  params: ReservationQueryParams = {}
): Promise<PaginatedResponse<ReservationRecord>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.warehouse && params.warehouse !== "ALL") query.set("warehouse", params.warehouse);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`/api/inventory/reservations?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch reservations");
  }
  return res.json();
}

export async function fetchReservationById(id: string): Promise<ReservationRecord | null> {
  const res = await fetch(`/api/inventory/reservations?search=${encodeURIComponent(id)}&limit=1`);
  if (!res.ok) {
    throw new Error(`Failed to fetch reservation ${id}`);
  }
  const data: PaginatedResponse<ReservationRecord> = await res.json();
  return data.data?.[0] ?? null;
}

