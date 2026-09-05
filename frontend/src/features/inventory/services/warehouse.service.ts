import type { WarehouseDetail } from "../types/inventory.types";

export async function fetchWarehouses(): Promise<WarehouseDetail[]> {
  const res = await fetch("/api/inventory/warehouses");
  if (!res.ok) {
    throw new Error("Failed to fetch warehouses list");
  }
  return res.json();
}

export async function fetchWarehouseDetails(warehouseId: string): Promise<{
  warehouse: WarehouseDetail;
  products: any[];
  reservations: any[];
  shipments: any[];
}> {
  const res = await fetch(`/api/inventory/warehouses/${encodeURIComponent(warehouseId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch warehouse details for ${warehouseId}`);
  }
  return res.json();
}
