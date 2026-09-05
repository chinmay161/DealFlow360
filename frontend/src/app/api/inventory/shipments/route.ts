import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  ShipmentRecord,
  PaginatedResponse,
  ShipmentStatusType,
  ShipmentTimelineMilestone,
  VerticalTimelineStep,
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

function buildVerticalTimeline(
  status: ShipmentStatusType,
  createdAt: Date,
  shippedAt?: Date | null,
  deliveredAt?: Date | null
): VerticalTimelineStep[] {
  const isDelivered = status === "DELIVERED";
  const isInTransit = isDelivered || status === "IN_TRANSIT";
  const isDispatched = isInTransit || status === "SHIPPED";
  const isPacked = isDispatched || status === "PACKED";
  const isReserved = isPacked || status === "READY" || status === "PLANNED";

  const quoteTime = new Date(createdAt.getTime() - 4 * 3600 * 1000).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const resTime = createdAt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const packedTime = new Date(createdAt.getTime() + 6 * 3600 * 1000).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const shipTime = shippedAt
    ? new Date(shippedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Pending Dispatch";
  const inTransitTime = shippedAt
    ? new Date(shippedAt.getTime() + 8 * 3600 * 1000).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Carrier handoff awaited";
  const delTime = deliveredAt
    ? new Date(deliveredAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Awaiting final delivery";

  return [
    {
      stage: "Quotation Approved",
      label: "Proposal Approved",
      description: "Governance clearance granted; order released for fulfillment",
      timestamp: quoteTime,
      status: "completed",
    },
    {
      stage: "Inventory Reserved",
      label: "Stock Allocated",
      description: "SKU quantity locked exclusively at fulfillment hub",
      timestamp: resTime,
      status: isReserved ? "completed" : "pending",
    },
    {
      stage: "Packed",
      label: "Order Packed & Verified",
      description: "Items picked, inspected, and crated for dispatch",
      timestamp: isPacked ? packedTime : "Scheduled",
      status: status === "PACKED" ? "current" : isPacked ? "completed" : "pending",
    },
    {
      stage: "Dispatched",
      label: "Dispatched from Hub",
      description: "Consignment sealed and released to carrier",
      timestamp: isDispatched ? shipTime : "Awaiting carrier pickup",
      status: status === "SHIPPED" ? "current" : isDispatched ? "completed" : "pending",
    },
    {
      stage: "In Transit",
      label: "In Transit with Carrier",
      description: "Out for distribution across regional logistics corridors",
      timestamp: isInTransit ? inTransitTime : "Pending route movement",
      status: status === "IN_TRANSIT" ? "current" : isInTransit ? "completed" : "pending",
    },
    {
      stage: "Delivered",
      label: "Delivered to Customer",
      description: "Proof of delivery signed and consignment confirmed",
      timestamp: isDelivered ? delTime : "Estimated 1-2 business days",
      status: isDelivered ? "completed" : "pending",
    },
  ];
}

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

      let estDelivery = "Tomorrow by 4:00 PM";
      if (s.status === "DELIVERED" && s.deliveredAt) {
        estDelivery = s.deliveredAt.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } else if (s.shippedAt) {
        const arrival = new Date(s.shippedAt.getTime() + 48 * 3600 * 1000);
        estDelivery = arrival.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

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
        estimatedDelivery: estDelivery,
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
        verticalTimeline: buildVerticalTimeline(
          s.status as ShipmentStatusType,
          s.createdAt,
          s.shippedAt,
          s.deliveredAt
        ),
      };
    });

    if (search) {
      mapped = mapped.filter(
        (s) =>
          s.shipmentNumber.toLowerCase().includes(search) ||
          s.orderNumber.toLowerCase().includes(search) ||
          (s.quotationNumber && s.quotationNumber.toLowerCase().includes(search)) ||
          s.customerName?.toLowerCase().includes(search) ||
          s.warehouseName.toLowerCase().includes(search) ||
          s.destination.toLowerCase().includes(search) ||
          s.trackingCode?.toLowerCase().includes(search) ||
          s.carrier.toLowerCase().includes(search)
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
