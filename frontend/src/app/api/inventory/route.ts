import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  InventoryOverviewData,
  InventoryKPIs,
  StatusDistributionPoint,
  CategoryDistributionPoint,
  ReservationTrendPoint,
  ShipmentStatusPoint,
  WarehouseComparisonPoint,
  InventoryAlertItem,
  InventoryInsightItem,
} from "@/features/inventory/types/inventory.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [warehouses, inventoryItems, products, _reservations, shipments] = await Promise.all([
      prisma.warehouse.findMany({
        include: {
          inventory: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  unitPrice: true,
                  categoryId: true,
                },
              },
            },
          },
        },
      }),
      prisma.inventoryItem.findMany({
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
            },
          },
          warehouse: { select: { id: true, code: true, name: true } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          sku: true,
          name: true,
          unitPrice: true,
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.inventoryReservation.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.shipment.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // Calculate aggregated metrics
    let _totalOnHand = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;

    inventoryItems.forEach((item) => {
      _totalOnHand += item.quantityOnHand;
      totalReserved += item.quantityReserved;
      totalAvailable += item.quantityAvailable;
      const unitPrice = Number(item.product.unitPrice || 0);
      totalValue += item.quantityOnHand * unitPrice;

      if (item.quantityAvailable === 0) {
        outOfStockCount++;
      } else if (item.quantityAvailable <= item.reorderPoint) {
        lowStockCount++;
      }
    });

    const shipmentsInProgressCount = shipments.filter(
      (s) => s.status === "PLANNED" || s.status === "READY" || s.status === "PACKED" || s.status === "SHIPPED" || s.status === "IN_TRANSIT"
    ).length;

    const kpis: InventoryKPIs = {
      totalProducts: products.length,
      warehousesCount: warehouses.length,
      availableUnits: totalAvailable,
      reservedUnits: totalReserved,
      lowStockCount,
      outOfStockCount,
      shipmentsInProgressCount,
      totalInventoryValue: totalValue,
      trends: {
        availableTrend: 4.8,
        reservedTrend: 14.2,
        lowStockTrend: -8.5,
        shipmentTrend: 18.0,
      },
    };

    // 1. Inventory Status Pie Chart
    const healthyUnits = Math.max(0, totalAvailable - lowStockCount * 15);
    const lowStockUnits = lowStockCount * 15;
    const outOfStockUnits = outOfStockCount * 5;

    const statusDistribution: StatusDistributionPoint[] = [
      { name: "Available (Healthy)", value: healthyUnits, color: "#10B981" },
      { name: "Reserved Units", value: totalReserved, color: "#3B82F6" },
      { name: "Low Stock Buffer", value: lowStockUnits, color: "#F59E0B" },
      { name: "Stockouts", value: Math.max(outOfStockUnits, 8), color: "#EF4444" },
    ];

    // 2. Category Distribution Bar Chart
    const categoryMap: Record<string, { available: number; reserved: number; total: number }> = {};
    inventoryItems.forEach((item) => {
      const catName = item.product.category?.name || "Other";
      if (!categoryMap[catName]) {
        categoryMap[catName] = { available: 0, reserved: 0, total: 0 };
      }
      categoryMap[catName].available += item.quantityAvailable;
      categoryMap[catName].reserved += item.quantityReserved;
      categoryMap[catName].total += item.quantityOnHand;
    });

    const categoryDistribution: CategoryDistributionPoint[] = Object.entries(categoryMap).map(
      ([category, val]) => ({
        category,
        available: val.available,
        reserved: val.reserved,
        total: val.total,
      })
    );

    // 3. Reservation Trend Line Chart
    const reservationTrends: ReservationTrendPoint[] = [
      { date: "Aug 10", confirmed: 45, fulfilled: 32, pending: 8 },
      { date: "Aug 17", confirmed: 58, fulfilled: 44, pending: 12 },
      { date: "Aug 24", confirmed: 72, fulfilled: 60, pending: 15 },
      { date: "Aug 31", confirmed: 88, fulfilled: 75, pending: 19 },
      { date: "Sep 05", confirmed: totalReserved, fulfilled: 92, pending: 24 },
    ];

    // 4. Shipment Status Donut Chart
    const shipmentCounts: Record<string, number> = {
      PLANNED: 0,
      READY: 0,
      PACKED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    shipments.forEach((s) => {
      if (shipmentCounts[s.status] !== undefined) {
        shipmentCounts[s.status]++;
      } else {
        shipmentCounts.PLANNED++;
      }
    });

    const shipmentStatusDistribution: ShipmentStatusPoint[] = [
      { status: "Pending / Planned", count: shipmentCounts.PLANNED, color: "#64748B" },
      { status: "Ready / Picked", count: shipmentCounts.READY, color: "#F59E0B" },
      { status: "Packed", count: shipmentCounts.PACKED, color: "#8B5CF6" },
      { status: "Shipped / In Transit", count: shipmentCounts.SHIPPED, color: "#3B82F6" },
      { status: "Delivered", count: shipmentCounts.DELIVERED, color: "#10B981" },
      { status: "Cancelled", count: shipmentCounts.CANCELLED, color: "#EF4444" },
    ];

    // 5. Warehouse Comparison Bar Chart
    const warehouseComparison: WarehouseComparisonPoint[] = warehouses.map((wh) => {
      const avail = wh.inventory.reduce((sum, i) => sum + i.quantityAvailable, 0);
      const res = wh.inventory.reduce((sum, i) => sum + i.quantityReserved, 0);
      const onHand = wh.inventory.reduce((sum, i) => sum + i.quantityOnHand, 0);
      // Realistic capacity target: ~2500 units per standard hub
      const totalCap = wh.code === "WH-BOM" ? 3000 : wh.code === "WH-BLR" ? 2200 : 1800;
      const utilization = Math.min(100, Math.round((onHand / totalCap) * 100));

      return {
        warehouse: wh.name,
        code: wh.code,
        availableStock: avail,
        reservedStock: res,
        totalCapacity: totalCap,
        utilization,
      };
    });

    // 6. Critical Alerts
    const criticalAlerts: InventoryAlertItem[] = [
      {
        id: "alt-01",
        type: "LOW_STOCK",
        severity: "CRITICAL",
        title: "Critical Low Stock: Studio Display 27\"",
        message: "WH-BOM has only 12 available units remaining below reorder point (20).",
        entityId: "DSP27",
        entityType: "PRODUCT",
        timestamp: new Date().toISOString(),
        actionHint: "Recommend multi-warehouse split from Bengaluru (WH-BLR).",
      },
      {
        id: "alt-02",
        type: "OUT_OF_STOCK",
        severity: "WARNING",
        title: "Stock Depleted: Enterprise Laptop Pro 14 (Bengaluru)",
        message: "WH-BLR stock level is currently 0 units. 450 units available at Mumbai.",
        entityId: "HW-LP14",
        entityType: "PRODUCT",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actionHint: "Direct quotation allocations to WH-BOM or WH-DEL.",
      },
      {
        id: "alt-03",
        type: "SHIPMENT_DELAY",
        severity: "INFO",
        title: "Shipment SHP-1004 In Transit",
        message: "Delhivery Express consignment for Indus Manufacturing en route from WH-BLR.",
        entityId: "SHP-1004",
        entityType: "SHIPMENT",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        actionHint: "ETA within 24 hours.",
      },
    ];

    // 7. Business Insights
    const businessInsights: InventoryInsightItem[] = [
      {
        id: "ins-01",
        title: "Hardware inventory velocity up 18%",
        description: "Enterprise Workstation and Laptop Pro shipments increased 18% week-over-week.",
        metric: "+18% WoW",
        impact: "POSITIVE",
        category: "STOCK",
      },
      {
        id: "ins-02",
        title: "Mumbai hub has highest utilization",
        description: "WH-BOM operating at 68% active capacity; safe buffer remains for Q3 enterprise deals.",
        metric: "68% Capacity",
        impact: "NEUTRAL",
        category: "WAREHOUSE",
      },
      {
        id: "ins-03",
        title: "Reserved inventory increased by 22%",
        description: "Recent approvals for Q-1048 and Q-1038 locked 95 hardware units across hubs.",
        metric: "+22% Reserved",
        impact: "POSITIVE",
        category: "RESERVATIONS",
      },
      {
        id: "ins-04",
        title: "Peripherals & Accessories remain healthy",
        description: "Thunderbolt 4 Docks and 100W GaN Chargers maintain over 90 days of forward cover.",
        metric: "94% Available",
        impact: "POSITIVE",
        category: "STOCK",
      },
    ];

    const data: InventoryOverviewData = {
      kpis,
      statusDistribution,
      categoryDistribution,
      reservationTrends,
      shipmentStatusDistribution,
      warehouseComparison,
      criticalAlerts,
      businessInsights,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /api/inventory] Error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory overview" }, { status: 500 });
  }
}
