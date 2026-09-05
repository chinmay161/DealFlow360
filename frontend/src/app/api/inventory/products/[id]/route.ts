import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { sku: id }],
      },
      include: {
        category: { select: { id: true, name: true } },
        inventoryItems: {
          include: {
            warehouse: { select: { id: true, code: true, name: true, location: true } },
          },
        },
        reservations: {
          include: {
            warehouse: { select: { code: true, name: true } },
            quotation: {
              select: {
                id: true,
                quotationNumber: true,
                customer: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        shipmentItems: {
          include: {
            shipment: {
              include: {
                warehouse: { select: { code: true, name: true } },
                order: {
                  select: {
                    orderNumber: true,
                    customer: { select: { name: true } },
                  },
                },
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let totalOnHand = 0;
    let totalAvailable = 0;
    let totalReserved = 0;

    const warehouseBreakdown = product.inventoryItems.map((inv) => {
      totalOnHand += inv.quantityOnHand;
      totalAvailable += inv.quantityAvailable;
      totalReserved += inv.quantityReserved;

      return {
        warehouseId: inv.warehouse.id,
        warehouseCode: inv.warehouse.code,
        warehouseName: inv.warehouse.name,
        location: inv.warehouse.location,
        onHand: inv.quantityOnHand,
        available: inv.quantityAvailable,
        reserved: inv.quantityReserved,
        freeStock: Math.max(0, inv.quantityOnHand - inv.quantityReserved),
        reorderPoint: inv.reorderPoint,
        status:
          inv.quantityAvailable === 0
            ? "OUT_OF_STOCK"
            : inv.quantityAvailable <= inv.reorderPoint
            ? "LOW_STOCK"
            : "HEALTHY",
      };
    });

    const freeStock = Math.max(0, totalOnHand - totalReserved);

    return NextResponse.json({
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category?.name || "General",
        unitPrice: Number(product.unitPrice || 0),
        costPrice: Number(product.costPrice || 0),
        taxRate: Number(product.taxRate || 0),
        totalOnHand,
        totalAvailable,
        totalReserved,
        freeStock,
      },
      warehouses: warehouseBreakdown,
      reservations: product.reservations.map((r) => ({
        id: r.id,
        quotationNumber: r.quotation?.quotationNumber || "N/A",
        customerName: r.quotation?.customer?.name || "Corporate Account",
        warehouseCode: r.warehouse.code,
        warehouseName: r.warehouse.name,
        quantity: r.quantity,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      shipments: product.shipmentItems.map((si) => ({
        id: si.shipment.id,
        shipmentNumber: si.shipment.shipmentNumber,
        orderNumber: si.shipment.order.orderNumber,
        customerName: si.shipment.order.customer.name,
        warehouseCode: si.shipment.warehouse.code,
        warehouseName: si.shipment.warehouse.name,
        status: si.shipment.status,
        carrier: si.shipment.carrier,
        trackingCode: si.shipment.trackingCode,
        quantity: si.quantity,
      })),
    });
  } catch (error) {
    console.error("[API /api/inventory/products/[id]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch product availability" }, { status: 500 });
  }
}
