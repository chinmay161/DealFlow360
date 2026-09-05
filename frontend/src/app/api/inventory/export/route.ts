import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv"; // csv, json

    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        product: {
          include: { category: true },
        },
        warehouse: true,
      },
      orderBy: { product: { sku: "asc" } },
    });

    const rows = inventoryItems.map((item) => ({
      sku: item.product.sku,
      productName: item.product.name,
      category: item.product.category?.name || "General",
      warehouseCode: item.warehouse.code,
      warehouseName: item.warehouse.name,
      onHand: item.quantityOnHand,
      reserved: item.quantityReserved,
      available: item.quantityAvailable,
      freeStock: Math.max(0, item.quantityOnHand - item.quantityReserved),
      reorderPoint: item.reorderPoint,
      unitPriceINR: Number(item.product.unitPrice || 0),
      totalValueINR: item.quantityOnHand * Number(item.product.unitPrice || 0),
      status:
        item.quantityAvailable === 0
          ? "OUT_OF_STOCK"
          : item.quantityAvailable <= item.reorderPoint
          ? "LOW_STOCK"
          : "HEALTHY",
    }));

    if (format === "json") {
      return NextResponse.json(rows);
    }

    // CSV format
    const headers = [
      "SKU",
      "Product Name",
      "Category",
      "Warehouse Code",
      "Warehouse Name",
      "On Hand",
      "Reserved",
      "Available",
      "Free Stock",
      "Reorder Point",
      "Unit Price (INR)",
      "Total Value (INR)",
      "Status",
    ];

    const csvLines = [headers.join(",")];
    for (const r of rows) {
      const escape = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
      csvLines.push(
        [
          escape(r.sku),
          escape(r.productName),
          escape(r.category),
          escape(r.warehouseCode),
          escape(r.warehouseName),
          r.onHand,
          r.reserved,
          r.available,
          r.freeStock,
          r.reorderPoint,
          r.unitPriceINR,
          r.totalValueINR,
          escape(r.status),
        ].join(",")
      );
    }

    const csvContent = csvLines.join("\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dealflow360-inventory-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[API /api/inventory/export] Error:", error);
    return NextResponse.json({ error: "Failed to export inventory" }, { status: 500 });
  }
}
