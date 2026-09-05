import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { InventoryAlertItem } from "@/features/inventory/types/inventory.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [lowStockItems, outOfStockItems, delayedShipments, largeReservations] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: {
          quantityAvailable: { gt: 0 },
        },
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { code: true, name: true } },
        },
      }),
      prisma.inventoryItem.findMany({
        where: {
          quantityAvailable: 0,
        },
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { code: true, name: true } },
        },
      }),
      prisma.shipment.findMany({
        where: {
          status: { in: ["SHIPPED", "IN_TRANSIT"] },
        },
        include: {
          warehouse: { select: { code: true, name: true } },
          order: {
            select: {
              orderNumber: true,
              customer: { select: { name: true } },
            },
          },
        },
        take: 5,
      }),
      prisma.inventoryReservation.findMany({
        where: {
          quantity: { gte: 25 },
        },
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { code: true, name: true } },
          quotation: { select: { quotationNumber: true } },
        },
        take: 5,
      }),
    ]);

    const alerts: InventoryAlertItem[] = [];

    // Filter truly low stock items
    const filteredLowStock = lowStockItems.filter(
      (item) => item.quantityAvailable <= item.reorderPoint
    );

    filteredLowStock.forEach((item, index) => {
      alerts.push({
        id: `alert-low-${item.id}-${index}`,
        type: "LOW_STOCK",
        severity: "CRITICAL",
        title: `Low Stock: ${item.product.name} (${item.warehouse.code})`,
        message: `${item.quantityAvailable} units available, below reorder point of ${item.reorderPoint}.`,
        entityId: item.product.sku,
        entityType: "PRODUCT",
        timestamp: new Date().toISOString(),
        actionHint: "Evaluate stock transfers or initiate replenishment requisition.",
      });
    });

    outOfStockItems.forEach((item, index) => {
      alerts.push({
        id: `alert-oos-${item.id}-${index}`,
        type: "OUT_OF_STOCK",
        severity: "CRITICAL",
        title: `Stock Depleted: ${item.product.name} (${item.warehouse.code})`,
        message: `Warehouse ${item.warehouse.name} has 0 fulfillable units.`,
        entityId: item.product.sku,
        entityType: "PRODUCT",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actionHint: "Direct quotation allocations to alternate regional distribution hub.",
      });
    });

    delayedShipments.forEach((s) => {
      alerts.push({
        id: `alert-delay-${s.id}`,
        type: "SHIPMENT_DELAY",
        severity: "WARNING",
        title: `Shipment Transit Monitoring: ${s.shipmentNumber}`,
        message: `Consignment via ${s.carrier} for order ${s.order.orderNumber} in transit from ${s.warehouse.code}.`,
        entityId: s.shipmentNumber,
        entityType: "SHIPMENT",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        actionHint: "Monitor carrier tracking telemetry.",
      });
    });

    largeReservations.forEach((r) => {
      alerts.push({
        id: `alert-res-${r.id}`,
        type: "LARGE_RESERVATION",
        severity: "INFO",
        title: `High-Volume Reservation: ${r.quantity} units (${r.product.sku})`,
        message: `Reserved for ${r.quotation?.quotationNumber || "Direct Order"} at ${r.warehouse.name}.`,
        entityId: r.id,
        entityType: "RESERVATION",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        actionHint: "Lock allocation to prevent conflicting enterprise quotes.",
      });
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("[API /api/inventory/alerts] Error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory alerts" }, { status: 500 });
  }
}
