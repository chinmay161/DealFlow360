import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { WarehouseDetail } from "@/features/inventory/types/inventory.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        inventory: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },
        },
        reservations: true,
        shipments: true,
      },
      orderBy: { code: "asc" },
    });

    const response: WarehouseDetail[] = warehouses.map((wh) => {
      let totalOnHand = 0;
      let totalAvailable = 0;
      let totalReserved = 0;

      wh.inventory.forEach((i) => {
        totalOnHand += i.quantityOnHand;
        totalAvailable += i.quantityAvailable;
        totalReserved += i.quantityReserved;
      });

      const capacity = wh.code === "WH-BOM" ? 3000 : wh.code === "WH-BLR" ? 2200 : 1800;
      const utilizationRate = Math.min(100, Math.round((totalOnHand / capacity) * 100));

      const topProducts = wh.inventory
        .slice(0, 5)
        .map((i) => ({
          sku: i.product.sku,
          name: i.product.name,
          available: i.quantityAvailable,
          reserved: i.quantityReserved,
        }));

      return {
        id: wh.id,
        code: wh.code,
        name: wh.name,
        location: wh.location,
        country: wh.country,
        isActive: wh.isActive,
        productsCount: wh.inventory.length,
        totalOnHand,
        totalAvailable,
        totalReserved,
        capacity,
        utilizationRate,
        activeReservationsCount: wh.reservations.filter((r) => r.status === "CONFIRMED" || r.status === "PENDING").length,
        activeShipmentsCount: wh.shipments.filter((s) => s.status !== "DELIVERED" && s.status !== "CANCELLED").length,
        topProducts,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /api/inventory/warehouses] Error:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}
