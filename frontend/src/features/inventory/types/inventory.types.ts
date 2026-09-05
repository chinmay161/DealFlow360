export type StockStatus = "HEALTHY" | "LOW_STOCK" | "OUT_OF_STOCK";

export type ShipmentStatusType =
  | "PLANNED"
  | "READY"
  | "PICKED"
  | "PACKED"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type ReservationStatusType =
  | "CONFIRMED"
  | "FULFILLED"
  | "RELEASED"
  | "PENDING";

export type UserInventoryRole = "SALES_REP" | "MANAGER";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  freeStock: number;
  reorderPoint: number;
  unitPrice: number;
  costPrice: number;
  status: StockStatus;
  updatedAt: string;
}

export interface WarehouseDetail {
  id: string;
  code: string;
  name: string;
  location: string;
  country: string;
  isActive: boolean;
  productsCount: number;
  totalOnHand: number;
  totalAvailable: number;
  totalReserved: number;
  capacity: number;
  utilizationRate: number; // percentage (0 - 100)
  activeReservationsCount: number;
  activeShipmentsCount: number;
  topProducts?: {
    sku: string;
    name: string;
    available: number;
    reserved: number;
  }[];
}

export interface ReservationRecord {
  id: string;
  orderId?: string | null;
  quotationId?: string | null;
  quotationNumber?: string;
  customerName?: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  remainingInventory?: number;
  reservationDate?: string;
  expiryDate?: string;
  status: ReservationStatusType;
  createdAt: string;
  updatedAt: string;
}

export type FulfillmentTimelineStage =
  | "Quotation Approved"
  | "Inventory Reserved"
  | "Packed"
  | "Dispatched"
  | "In Transit"
  | "Delivered";

export interface VerticalTimelineStep {
  stage: FulfillmentTimelineStage;
  label: string;
  description?: string;
  timestamp?: string | null;
  status: "completed" | "current" | "pending" | "cancelled";
}

export interface ShipmentTimelineMilestone {
  stage: "Reserved" | "Packed" | "Shipped" | "Delivered";
  completed: boolean;
  current: boolean;
  timestamp?: string | null;
  label?: string;
}

export interface ShipmentRecord {
  id: string;
  shipmentNumber: string;
  orderId: string;
  orderNumber: string;
  quotationNumber?: string;
  customerName?: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  destination: string;
  carrier: string;
  trackingCode?: string | null;
  status: ShipmentStatusType;
  reservedQuantity: number;
  estimatedDelivery?: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
  }[];
  timeline: ShipmentTimelineMilestone[];
  verticalTimeline?: VerticalTimelineStep[];
}

export interface InventoryKPIs {
  totalProducts: number;
  warehousesCount: number;
  availableUnits: number;
  reservedUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  shipmentsInProgressCount: number;
  totalInventoryValue: number;
  trends: {
    availableTrend: number;
    reservedTrend: number;
    lowStockTrend: number;
    shipmentTrend: number;
  };
}

export interface StatusDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface CategoryDistributionPoint {
  category: string;
  available: number;
  reserved: number;
  total: number;
}

export interface ReservationTrendPoint {
  date: string;
  confirmed: number;
  fulfilled: number;
  pending: number;
}

export interface ShipmentStatusPoint {
  status: string;
  count: number;
  color: string;
}

export interface WarehouseComparisonPoint {
  warehouse: string;
  code: string;
  availableStock: number;
  reservedStock: number;
  totalCapacity: number;
  utilization: number;
}

export interface InventoryAlertItem {
  id: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK" | "SHIPMENT_DELAY" | "LARGE_RESERVATION" | "EXPIRY_WARNING";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  entityId?: string;
  entityType?: "PRODUCT" | "WAREHOUSE" | "SHIPMENT" | "RESERVATION";
  timestamp: string;
  actionHint?: string;
}

export interface InventoryInsightItem {
  id: string;
  title: string;
  description: string;
  metric?: string;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  category: "STOCK" | "WAREHOUSE" | "FULFILLMENT" | "RESERVATIONS";
}

export interface InventoryOverviewData {
  kpis: InventoryKPIs;
  statusDistribution: StatusDistributionPoint[];
  categoryDistribution: CategoryDistributionPoint[];
  reservationTrends: ReservationTrendPoint[];
  shipmentStatusDistribution: ShipmentStatusPoint[];
  warehouseComparison: WarehouseComparisonPoint[];
  criticalAlerts: InventoryAlertItem[];
  businessInsights: InventoryInsightItem[];
}

export interface InventoryFilterParams {
  search?: string;
  category?: string;
  warehouse?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StockValidationResult {
  isValid: boolean;
  sku: string;
  productName: string;
  requestedQty: number;
  availableQty: number;
  reservedQty: number;
  freeStock: number;
  deficit: number;
  status: "PASS" | "WARN" | "FAIL";
  ruleMessage?: string;
  counterfactualRecommendation?: string;
  warehouseAllocations?: {
    warehouseId: string;
    warehouseName: string;
    available: number;
    reserved: number;
    recommendedAllocation: number;
  }[];
}
