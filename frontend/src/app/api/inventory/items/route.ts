import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { InventoryItem, StockStatus, PaginatedResponse } from "@/features/inventory/types/inventory.types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const categoryId = searchParams.get("category")?.trim() || "";
    const warehouseId = searchParams.get("warehouse")?.trim() || "";
    const status = searchParams.get("status")?.trim().toUpperCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder") || "asc").toLowerCase() === "desc" ? "desc" : "asc";

    const where: any = {};
    if (warehouseId && warehouseId !== "ALL") {
      where.warehouseId = warehouseId;
    }

    if (categoryId && categoryId !== "ALL") {
      where.product = {
        ...(where.product || {}),
        categoryId,
      };
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
        warehouse: { select: { id: true, code: true, name: true } },
      },
    });

    let mapped: InventoryItem[] = items.map((i) => {
      let itemStatus: StockStatus = "HEALTHY";
      if (i.quantityAvailable === 0) {
        itemStatus = "OUT_OF_STOCK";
      } else if (i.quantityAvailable <= i.reorderPoint) {
        itemStatus = "LOW_STOCK";
      }

      const freeStock = Math.max(0, i.quantityOnHand - i.quantityReserved);

      return {
        id: i.id,
        sku: i.product.sku,
        name: i.product.name,
        description: i.product.description,
        categoryId: i.product.categoryId,
        categoryName: i.product.category?.name || "Hardware",
        warehouseId: i.warehouse.id,
        warehouseCode: i.warehouse.code,
        warehouseName: i.warehouse.name,
        quantityOnHand: i.quantityOnHand,
        quantityReserved: i.quantityReserved,
        quantityAvailable: i.quantityAvailable,
        freeStock,
        reorderPoint: i.reorderPoint,
        unitPrice: Number(i.product.unitPrice || 0),
        costPrice: Number(i.product.costPrice || 0),
        status: itemStatus,
        updatedAt: i.updatedAt.toISOString(),
      };
    });

    // In-memory filter for search and status
    if (search) {
      mapped = mapped.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.sku.toLowerCase().includes(search) ||
          item.warehouseName.toLowerCase().includes(search) ||
          item.warehouseCode.toLowerCase().includes(search) ||
          item.categoryName.toLowerCase().includes(search)
      );
    }

    if (status && status !== "ALL") {
      mapped = mapped.filter((item) => item.status === status);
    }

    // Sorting
    mapped.sort((a, b) => {
      const valA: any = a[sortBy as keyof InventoryItem] ?? "";
      const valB: any = b[sortBy as keyof InventoryItem] ?? "";

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    const total = mapped.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = mapped.slice((page - 1) * limit, page * limit);

    const response: PaginatedResponse<InventoryItem> = {
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
    console.error("[API /api/inventory/items] Error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory items" }, { status: 500 });
  }
}
