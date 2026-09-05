import type { ShipmentRecord, PaginatedResponse } from "../types/inventory.types";

export async function fetchShipments(
  params: {
    search?: string;
    warehouse?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<PaginatedResponse<ShipmentRecord>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.warehouse && params.warehouse !== "ALL") query.set("warehouse", params.warehouse);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`/api/inventory/shipments?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch shipments");
  }
  return res.json();
}
