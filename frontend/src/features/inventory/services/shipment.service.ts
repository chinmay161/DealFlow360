import type { ShipmentRecord, PaginatedResponse } from "../types/inventory.types";

export interface ShipmentQueryParams {
  search?: string;
  warehouse?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function fetchShipments(
  params: ShipmentQueryParams = {}
): Promise<PaginatedResponse<ShipmentRecord>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.warehouse && params.warehouse !== "ALL") query.set("warehouse", params.warehouse);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`/api/inventory/shipments?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch shipments");
  }
  return res.json();
}

export async function fetchShipmentById(idOrNumber: string): Promise<ShipmentRecord | null> {
  const res = await fetch(`/api/inventory/shipments?search=${encodeURIComponent(idOrNumber)}&limit=1`);
  if (!res.ok) {
    throw new Error(`Failed to fetch shipment ${idOrNumber}`);
  }
  const data: PaginatedResponse<ShipmentRecord> = await res.json();
  return data.data?.[0] ?? null;
}

