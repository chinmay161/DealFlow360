import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        OR: [{ id }, { code: id.toUpperCase() }],
      },
      include: {
        inventory: {
          include: {
            product: {
              include: {
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
        reservations: {
          include: {
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
          take: 20,
        },
        shipments: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customer: { select: { id: true, name: true } },
              },
            },
            items: {
              include: {
                product: { select: { id: true, sku: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const totalOnHand = warehouse.inventory.reduce((sum, i) => sum + i.quantityOnHand, 0);
    const totalAvailable = warehouse.inventory.reduce((sum, i) => sum + i.quantityAvailable, 0);
    const totalReserved = warehouse.inventory.reduce((sum, i) => sum + i.quantityReserved, 0);
    const capacity = warehouse.code === "WH-BOM" ? 3000 : warehouse.code === "WH-BLR" ? 2200 : 1800;
    const utilizationRate = Math.min(100, Math.round((totalOnHand / capacity) * 100));

    return NextResponse.json({
      warehouse: {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        location: warehouse.location,
        country: warehouse.country,
        isActive: warehouse.isActive,
        capacity,
        totalOnHand,
        totalAvailable,
        totalReserved,
        utilizationRate,
      },
      products: warehouse.inventory.map((i) => ({
        id: i.id,
        productId: i.productId,
        sku: i.product.sku,
        name: i.product.name,
        categoryName: i.product.category?.name || "General",
        onHand: i.quantityOnHand,
        available: i.quantityAvailable,
        reserved: i.quantityReserved,
        freeStock: Math.max(0, i.quantityOnHand - i.quantityReserved),
        reorderPoint: i.reorderPoint,
        unitPrice: Number(i.product.unitPrice || 0),
        status:
          i.quantityAvailable === 0
            ? "OUT_OF_STOCK"
            : i.quantityAvailable <= i.reorderPoint
            ? "LOW_STOCK"
            : "HEALTHY",
      })),
      reservations: warehouse.reservations.map((r) => ({
        id: r.id,
        quotationId: r.quotationId,
        quotationNumber: r.quotation?.quotationNumber || "Q-DIRECT",
        customerName: r.quotation?.customer?.name || "Enterprise Account",
        productId: r.productId,
        sku: r.product.sku,
        productName: r.product.name,
        quantity: r.quantity,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      shipments: warehouse.shipments.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        orderNumber: s.order?.orderNumber || "ORD-PENDING",
        customerName: s.order?.customer?.name || "Enterprise Consignee",
        carrier: s.carrier,
        trackingCode: s.trackingCode,
        status: s.status,
        itemCount: s.items.length,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API /api/inventory/warehouses/[id]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch warehouse details" }, { status: 500 });
  }
}
