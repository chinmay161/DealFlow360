import type { FulfillmentItem, FulfillmentOrder, Reservation, Shipment, WarehouseAllocation, WarehouseStock } from "./types";

export const fulfillmentOrder: FulfillmentOrder = {
  reference: "ORD-1042",
  sourceQuote: "Q-1042",
  customer: "Apex Infotech Pvt. Ltd.",
  orderValue: 1830000,
  physicalUnits: 15,
  status: "Ready for Fulfillment",
  approval: "Approved",
  salesRepresentative: "Arjun Mehta",
};

export const fulfillmentItems: FulfillmentItem[] = [
  { id: "laptop", name: "Laptop Pro 14", sku: "HW-LP14", quantity: 10, type: "Hardware", stockStatus: "Available", fulfillmentStatus: "Ready" },
  { id: "migration", name: "Enterprise Setup & Migration", sku: "SRV-MIG", quantity: 1, type: "Service", stockStatus: "N/A", fulfillmentStatus: "Service Scheduled" },
  { id: "display", name: "27-inch 4K Studio Display", sku: "HW-DSP27", quantity: 5, type: "Hardware", stockStatus: "Available", fulfillmentStatus: "Ready" },
];

export const warehouseStock: WarehouseStock[] = [
  { productId: "laptop", warehouse: "Bengaluru Warehouse", available: 7, reserved: 0, fulfillable: 7 },
  { productId: "laptop", warehouse: "Mumbai Warehouse", available: 6, reserved: 1, fulfillable: 5 },
  { productId: "laptop", warehouse: "Delhi Warehouse", available: 2, reserved: 2, fulfillable: 0 },
  { productId: "display", warehouse: "Bengaluru Warehouse", available: 4, reserved: 1, fulfillable: 3 },
  { productId: "display", warehouse: "Mumbai Warehouse", available: 3, reserved: 0, fulfillable: 3 },
  { productId: "display", warehouse: "Delhi Warehouse", available: 0, reserved: 0, fulfillable: 0 },
];

export const recommendedAllocations: WarehouseAllocation[] = [
  { warehouse: "Bengaluru Warehouse", allocations: { laptop: 5, display: 2 }, availableStock: 10, estimatedShippingCost: 5000, shipmentGroups: 2 },
  { warehouse: "Mumbai Warehouse", allocations: { laptop: 5, display: 3 }, availableStock: 8, estimatedShippingCost: 7000, shipmentGroups: 2 },
];

export const reservation: Reservation = { id: "RSV-1042", status: "Reserved", reservedAt: "05 Sep 2026, 12:15 PM", expiresAt: "05 Sep 2026, 06:00 PM" };

export const shipments: Shipment[] = [
  { id: "SHP-1001", warehouse: "Bengaluru Warehouse", items: [{ productId: "laptop", quantity: 5 }, { productId: "display", quantity: 2 }], status: "Ready to Ship", estimatedShippingCost: 5000 },
  { id: "SHP-1002", warehouse: "Mumbai Warehouse", items: [{ productId: "laptop", quantity: 5 }, { productId: "display", quantity: 3 }], status: "Ready to Ship", estimatedShippingCost: 7000 },
];
