import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ReservationRecord, PaginatedResponse, ReservationStatusType } from "@/features/inventory/types/inventory.types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const warehouseId = searchParams.get("warehouse")?.trim() || "";
    const status = searchParams.get("status")?.trim().toUpperCase() || "";
    const sortBy = searchParams.get("sortBy")?.trim() || "createdAt";
    const sortOrder = searchParams.get("sortOrder")?.trim().toLowerCase() === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));

    const where: any = {};
    if (warehouseId && warehouseId !== "ALL") {
      where.warehouseId = warehouseId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [reservations, inventoryItems] = await Promise.all([
      prisma.inventoryReservation.findMany({
        where,
        include: {
          warehouse: { select: { id: true, code: true, name: true } },
          product: { select: { id: true, sku: true, name: true } },
          quotation: {
            select: {
              id: true,
              quotationNumber: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryItem.findMany({
        select: {
          warehouseId: true,
          productId: true,
          quantityAvailable: true,
          quantityReserved: true,
        },
      }),
    ]);

    const stockMap = new Map<string, number>();
    inventoryItems.forEach((item) => {
      const free = Math.max(0, item.quantityAvailable - item.quantityReserved);
      stockMap.set(`${item.warehouseId}_${item.productId}`, free);
    });

    let mapped: ReservationRecord[] = reservations.map((r) => {
      const freeStock = stockMap.get(`${r.warehouseId}_${r.productId}`) ?? 45;
      const createdDate = new Date(r.createdAt);
      const expDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      return {
        id: r.id,
        orderId: r.orderId,
        quotationId: r.quotationId,
        quotationNumber: r.quotation?.quotationNumber || "Q-DIRECT",
        customerName: r.quotation?.customer?.name || "Enterprise Account",
        warehouseId: r.warehouse.id,
        warehouseCode: r.warehouse.code,
        warehouseName: r.warehouse.name,
        productId: r.product.id,
        productName: r.product.name,
        sku: r.product.sku,
        quantity: r.quantity,
        remainingInventory: freeStock,
        reservationDate: createdDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        expiryDate: expDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        status: r.status as ReservationStatusType,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });

    if (search) {
      mapped = mapped.filter(
        (r) =>
          r.id.toLowerCase().includes(search) ||
          r.quotationNumber?.toLowerCase().includes(search) ||
          r.customerName?.toLowerCase().includes(search) ||
          r.warehouseName.toLowerCase().includes(search) ||
          r.productName.toLowerCase().includes(search) ||
          r.sku.toLowerCase().includes(search)
      );
    }

    if (sortBy) {
      mapped.sort((a, b) => {
        let valA: any = (a as any)[sortBy] ?? "";
        let valB: any = (b as any)[sortBy] ?? "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    const total = mapped.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = mapped.slice((page - 1) * limit, page * limit);

    const response: PaginatedResponse<ReservationRecord> = {
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /api/inventory/reservations] Error:", error);
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}
