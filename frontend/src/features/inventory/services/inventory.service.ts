import type {
  InventoryOverviewData,
  InventoryItem,
  PaginatedResponse,
  InventoryFilterParams,
  InventoryAlertItem,
  InventoryInsightItem,
  StockValidationResult,
} from "../types/inventory.types";

export async function fetchInventoryOverview(): Promise<InventoryOverviewData> {
  const res = await fetch("/api/inventory");
  if (!res.ok) {
    throw new Error("Failed to fetch inventory overview");
  }
  return res.json();
}

export async function fetchInventoryItems(
  params: InventoryFilterParams = {}
): Promise<PaginatedResponse<InventoryItem>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category && params.category !== "ALL") query.set("category", params.category);
  if (params.warehouse && params.warehouse !== "ALL") query.set("warehouse", params.warehouse);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const res = await fetch(`/api/inventory/items?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch inventory items");
  }
  return res.json();
}

export async function fetchProductAvailability(productId: string) {
  const res = await fetch(`/api/inventory/products/${encodeURIComponent(productId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch product availability for ${productId}`);
  }
  return res.json();
}

export async function fetchInventoryAlerts(): Promise<InventoryAlertItem[]> {
  const res = await fetch("/api/inventory/alerts");
  if (!res.ok) {
    throw new Error("Failed to fetch inventory alerts");
  }
  return res.json();
}

export async function fetchInventoryInsights(): Promise<InventoryInsightItem[]> {
  const res = await fetch("/api/inventory/insights");
  if (!res.ok) {
    throw new Error("Failed to fetch inventory insights");
  }
  return res.json();
}

export async function fetchInventoryTrends(range = "30D") {
  const res = await fetch(`/api/inventory/trends?range=${encodeURIComponent(range)}`);
  if (!res.ok) {
    throw new Error("Failed to fetch inventory trends");
  }
  return res.json();
}

export async function validateQuoteStock(
  options: { quotationId?: string; productId?: string; quantity?: number }
): Promise<{ quotationId?: string; quotationNumber?: string; items?: StockValidationResult[] } | StockValidationResult> {
  const query = new URLSearchParams();
  if (options.quotationId) query.set("quotationId", options.quotationId);
  if (options.productId) query.set("productId", options.productId);
  if (options.quantity) query.set("quantity", String(options.quantity));

  const res = await fetch(`/api/inventory/quote-stock?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to validate stock availability");
  }
  return res.json();
}
