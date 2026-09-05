export type FulfillmentStatus = "Ready for Fulfillment" | "Plan Confirmed";
export type AllocationStatus = "Recommended" | "Accepted";

export interface FulfillmentOrder {
  reference: string;
  sourceQuote: string;
  customer: string;
  orderValue: number;
  physicalUnits: number;
  status: FulfillmentStatus;
  approval: "Approved";
  salesRepresentative: string;
}

export interface FulfillmentItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  type: "Hardware" | "Service";
  stockStatus: "Available" | "N/A";
  fulfillmentStatus: "Ready" | "Service Scheduled";
}

export interface WarehouseStock {
  productId: string;
  warehouse: string;
  available: number;
  reserved: number;
  fulfillable: number;
}

export interface WarehouseAllocation {
  warehouse: string;
  allocations: Record<string, number>;
  availableStock: number;
  estimatedShippingCost: number;
  shipmentGroups: number;
}

export interface Reservation {
  id: string;
  status: "Reserved";
  reservedAt: string;
  expiresAt: string;
}

export interface Shipment {
  id: string;
  warehouse: string;
  items: { productId: string; quantity: number }[];
  status: "Ready to Ship";
  estimatedShippingCost: number;
}
