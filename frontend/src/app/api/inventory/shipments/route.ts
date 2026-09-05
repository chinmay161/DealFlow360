import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  ShipmentRecord,
  PaginatedResponse,
  ShipmentStatusType,
  ShipmentTimelineMilestone,
} from "@/features/inventory/types/inventory.types";

export const dynamic = "force-dynamic";

function buildTimeline(status: ShipmentStatusType, shippedAt?: Date | null, deliveredAt?: Date | null): ShipmentTimelineMilestone[] {
  const isDelivered = status === "DELIVERED";
  const isShipped = isDelivered || status === "SHIPPED" || status === "IN_TRANSIT";
  const isPacked = isShipped || status === "PACKED";

  return [
    {
      stage: "Reserved",
      completed: true,
      current: status === "PLANNED" || status === "READY",
      label: "Stock Allocated",
    },
    {
      stage: "Packed",
      completed: isPacked,
      current: status === "PACKED",
      label: "Dispatched from Hub",
    },
    {
      stage: "Shipped",
      completed: isShipped,
      current: status === "SHIPPED" || status === "IN_TRANSIT",
      timestamp: shippedAt ? shippedAt.toISOString() : undefined,
      label: "In Transit with Carrier",
    },
    {
      stage: "Delivered",
      completed: isDelivered,
      current: isDelivered,
      timestamp: deliveredAt ? deliveredAt.toISOString() : undefined,
      label: "Delivered to Customer",
    },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const warehouseId = searchParams.get("warehouse")?.trim() || "";
    const status = searchParams.get("status")?.trim().toUpperCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));

    const where: any = {};
    if (warehouseId && warehouseId !== "ALL") {
      where.warehouseId = warehouseId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        warehouse: { select: { id: true, code: true, name: true, location: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            quotation: { select: { quotationNumber: true } },
            customer: { select: { id: true, name: true, city: true, state: true } },
          },
        },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let mapped: ShipmentRecord[] = shipments.map((s) => {
      const reservedQty = s.items.reduce((sum, item) => sum + item.quantity, 0);
      const destination = s.order.customer
        ? `${s.order.customer.city || "Mumbai"}, ${s.order.customer.state || "MH"}`
        : "PAN-India";

      return {
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        orderId: s.orderId,
        orderNumber: s.order.orderNumber,
        quotationNumber: s.order.quotation?.quotationNumber,
        customerName: s.order.customer?.name || "Enterprise Consignee",
        warehouseId: s.warehouse.id,
        warehouseCode: s.warehouse.code,
        warehouseName: s.warehouse.name,
        destination,
        carrier: s.carrier,
        trackingCode: s.trackingCode,
        status: s.status as ShipmentStatusType,
        reservedQuantity: reservedQty,
        shippedAt: s.shippedAt?.toISOString() || null,
        deliveredAt: s.deliveredAt?.toISOString() || null,
        createdAt: s.createdAt.toISOString(),
        items: s.items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          sku: i.product.sku,
          quantity: i.quantity,
        })),
        timeline: buildTimeline(s.status as ShipmentStatusType, s.shippedAt, s.deliveredAt),
      };
    });

    if (search) {
      mapped = mapped.filter(
        (s) =>
          s.shipmentNumber.toLowerCase().includes(search) ||
          s.orderNumber.toLowerCase().includes(search) ||
          s.customerName?.toLowerCase().includes(search) ||
          s.warehouseName.toLowerCase().includes(search) ||
          s.trackingCode?.toLowerCase().includes(search) ||
          s.carrier.toLowerCase().includes(search)
      );
    }

    const total = mapped.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = mapped.slice((page - 1) * limit, page * limit);

    const response: PaginatedResponse<ShipmentRecord> = {
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
    console.error("[API /api/inventory/shipments] Error:", error);
    return NextResponse.json({ error: "Failed to fetch shipments" }, { status: 500 });
  }
}
