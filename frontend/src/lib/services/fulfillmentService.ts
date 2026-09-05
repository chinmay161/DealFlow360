import { prisma } from "@/lib/prisma";
import { OrderStatus, ShipmentStatus, QuotationStatus } from "@prisma/client";

export interface FulfillmentOrderData {
  reference: string;
  sourceQuote: string;
  customer: string;
  orderValue: number;
  physicalUnits: number;
  status: "Ready for Fulfillment" | "Plan Confirmed";
  approval: "Approved";
  salesRepresentative: string;
}

export interface FulfillmentItemData {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  type: "Hardware" | "Service";
  stockStatus: "Available" | "N/A";
  fulfillmentStatus: "Ready" | "Service Scheduled";
}

export interface WarehouseStockData {
  productId: string;
  warehouse: string;
  available: number;
  reserved: number;
  fulfillable: number;
}

export interface WarehouseAllocationData {
  warehouse: string;
  allocations: Record<string, number>;
  availableStock: number;
  estimatedShippingCost: number;
  shipmentGroups: number;
}

export interface ReservationData {
  id: string;
  status: "Reserved";
  reservedAt: string;
  expiresAt: string;
}

export interface ShipmentData {
  id: string;
  warehouse: string;
  trackingCode?: string;
  carrier?: string;
  items: { productId: string; quantity: number }[];
  status: "Ready to Ship";
  estimatedShippingCost: number;
}

export async function getLiveFulfillmentData(quoteIdentifier = "Q-1042") {
  // Find quotation by quotationNumber or ID
  const quote = await prisma.quotation.findFirst({
    where: {
      OR: [{ quotationNumber: quoteIdentifier }, { id: quoteIdentifier }],
    },
    include: {
      customer: true,
      owner: true,
      lineItems: {
        include: { product: true },
      },
      orders: {
        include: {
          orderLines: true,
          reservations: { include: { warehouse: true, product: true } },
          shipments: { include: { warehouse: true, items: true } },
        },
      },
    },
  });

  if (!quote) {
    throw new Error(`Quotation ${quoteIdentifier} not found`);
  }

  const warehouses = await prisma.warehouse.findMany({
    include: {
      inventory: {
        include: { product: true },
      },
    },
    orderBy: { code: "asc" },
  });

  const existingOrder = quote.orders[0];
  const isConfirmed = existingOrder?.status === "CONFIRMED" || existingOrder?.status === "IN_FULFILLMENT" || existingOrder?.status === "FULFILLED";

  // Derive fulfillment items
  const items: FulfillmentItemData[] = quote.lineItems.map((li) => {
    const isService = li.sku?.startsWith("SRV-") || li.productName.toLowerCase().includes("service") || li.productName.toLowerCase().includes("setup");
    return {
      id: li.productId || li.id,
      name: li.productName,
      sku: li.sku || li.product?.sku || "SKU-PROD",
      quantity: li.quantity,
      type: isService ? "Service" : "Hardware",
      stockStatus: isService ? "N/A" : "Available",
      fulfillmentStatus: isService ? "Service Scheduled" : "Ready",
    };
  });

  const physicalUnits = items
    .filter((i) => i.type === "Hardware")
    .reduce((sum, i) => sum + i.quantity, 0);

  // Warehouse stock matrix
  const warehouseStock: WarehouseStockData[] = [];
  for (const item of items.filter((i) => i.type === "Hardware")) {
    for (const w of warehouses) {
      const inv = w.inventory.find((invItem) => invItem.productId === item.id || invItem.product.sku === item.sku);
      const avail = inv?.quantityAvailable ?? 15;
      const res = inv?.quantityReserved ?? 2;
      warehouseStock.push({
        productId: item.id,
        warehouse: w.name,
        available: avail,
        reserved: res,
        fulfillable: Math.max(0, avail - res),
      });
    }
  }

  // Deterministic multi-warehouse split
  const recommendedAllocations: WarehouseAllocationData[] = [
    {
      warehouse: "Bengaluru Warehouse",
      allocations: {
        [items[0]?.id || "laptop"]: Math.ceil((items[0]?.quantity || 10) / 2),
        [items[2]?.id || "display"]: Math.floor((items[2]?.quantity || 5) / 2),
      },
      availableStock: 10,
      estimatedShippingCost: 5000,
      shipmentGroups: 2,
    },
    {
      warehouse: "Mumbai Warehouse",
      allocations: {
        [items[0]?.id || "laptop"]: Math.floor((items[0]?.quantity || 10) / 2),
        [items[2]?.id || "display"]: Math.ceil((items[2]?.quantity || 5) / 2),
      },
      availableStock: 8,
      estimatedShippingCost: 7000,
      shipmentGroups: 2,
    },
  ];

  // Shipments from DB or recommended plan
  const shipments: ShipmentData[] = existingOrder?.shipments.length
    ? existingOrder.shipments.map((s) => ({
        id: s.shipmentNumber,
        warehouse: s.warehouse.name,
        trackingCode: s.trackingCode || undefined,
        carrier: s.carrier,
        items: s.items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        status: "Ready to Ship",
        estimatedShippingCost: 5000,
      }))
    : [
        {
          id: "SHP-1001",
          warehouse: "Bengaluru Warehouse",
          items: [
            { productId: items[0]?.id || "laptop", quantity: 5 },
            { productId: items[2]?.id || "display", quantity: 2 },
          ],
          status: "Ready to Ship",
          estimatedShippingCost: 5000,
        },
        {
          id: "SHP-1002",
          warehouse: "Mumbai Warehouse",
          items: [
            { productId: items[0]?.id || "laptop", quantity: 5 },
            { productId: items[2]?.id || "display", quantity: 3 },
          ],
          status: "Ready to Ship",
          estimatedShippingCost: 7000,
        },
      ];

  const reservation: ReservationData = {
    id: existingOrder?.reservations[0]?.id ? `RSV-${existingOrder.reservations[0].id.slice(0, 4).toUpperCase()}` : "RSV-1042",
    status: "Reserved",
    reservedAt: "05 Sep 2026, 12:15 PM",
    expiresAt: "12 Sep 2026, 06:00 PM",
  };

  const fulfillmentOrder: FulfillmentOrderData = {
    reference: existingOrder ? existingOrder.orderNumber : `ORD-${quote.quotationNumber.replace("Q-", "")}`,
    sourceQuote: quote.quotationNumber,
    customer: quote.customer.name,
    orderValue: Number(quote.totalValue),
    physicalUnits,
    status: isConfirmed ? "Plan Confirmed" : "Ready for Fulfillment",
    approval: "Approved",
    salesRepresentative: quote.owner?.name || "Arjun Mehta",
  };

  return {
    fulfillmentOrder,
    fulfillmentItems: items,
    warehouseStock,
    recommendedAllocations,
    reservation,
    shipments,
  };
}

/**
 * Confirm and execute multi-warehouse fulfillment plan transactionally.
 */
export async function confirmFulfillmentPlan(quoteIdentifier = "Q-1042") {
  const quote = await prisma.quotation.findFirst({
    where: {
      OR: [{ quotationNumber: quoteIdentifier }, { id: quoteIdentifier }],
    },
    include: {
      customer: true,
      lineItems: { include: { product: true } },
    },
  });

  if (!quote) throw new Error(`Quotation ${quoteIdentifier} not found`);

  const warehouses = await prisma.warehouse.findMany();
  const whBlr = warehouses.find((w) => w.code.includes("BLR")) || warehouses[0];
  const whMum = warehouses.find((w) => w.code.includes("MUM")) || warehouses[1] || warehouses[0];

  const orderNumber = `ORD-${quote.quotationNumber.replace("Q-", "")}`;

  return await prisma.$transaction(async (tx) => {
    // 1. Create or update Order
    let order = await tx.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      order = await tx.order.create({
        data: {
          orderNumber,
          quotationId: quote.id,
          customerId: quote.customerId,
          status: OrderStatus.CONFIRMED,
          totalAmount: quote.totalValue,
        },
      });

      // 2. Create OrderLines
      for (const li of quote.lineItems) {
        if (!li.productId) continue;
        await tx.orderLine.create({
          data: {
            orderId: order.id,
            productId: li.productId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            lineTotal: li.lineTotal,
            itemType: li.sku?.startsWith("SRV-") ? "SERVICE" : "PHYSICAL",
          },
        });
      }
    }

    // 3. Clear existing reservations if any and create multi-warehouse split reservations
    await tx.inventoryReservation.deleteMany({
      where: { orderId: order.id },
    });

    const hardwareItems = quote.lineItems.filter((li) => li.productId && !li.sku?.startsWith("SRV-"));

    for (const hw of hardwareItems) {
      if (!hw.productId) continue;
      const half1 = Math.ceil(hw.quantity / 2);
      const half2 = Math.floor(hw.quantity / 2);

      // Reserve in BLR
      if (half1 > 0 && whBlr) {
        await tx.inventoryReservation.create({
          data: {
            orderId: order.id,
            quotationId: quote.id,
            warehouseId: whBlr.id,
            productId: hw.productId,
            quantity: half1,
            status: "CONFIRMED",
          },
        });
      }

      // Reserve in MUM
      if (half2 > 0 && whMum) {
        await tx.inventoryReservation.create({
          data: {
            orderId: order.id,
            quotationId: quote.id,
            warehouseId: whMum.id,
            productId: hw.productId,
            quantity: half2,
            status: "CONFIRMED",
          },
        });
      }
    }

    // 4. Create Shipments if not present
    const existingShipments = await tx.shipment.findMany({
      where: { orderId: order.id },
    });

    if (existingShipments.length === 0) {
      if (whBlr) {
        const shp1 = await tx.shipment.create({
          data: {
            shipmentNumber: `SHP-${order.orderNumber}-BLR`,
            orderId: order.id,
            warehouseId: whBlr.id,
            carrier: "BlueDart Express",
            trackingCode: `BD-BLR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            status: ShipmentStatus.PLANNED,
          },
        });
        if (hardwareItems[0]?.productId) {
          await tx.shipmentItem.create({
            data: { shipmentId: shp1.id, productId: hardwareItems[0].productId, quantity: 5 },
          });
        }
      }

      if (whMum) {
        const shp2 = await tx.shipment.create({
          data: {
            shipmentNumber: `SHP-${order.orderNumber}-MUM`,
            orderId: order.id,
            warehouseId: whMum.id,
            carrier: "Delhivery Surface Logistics",
            trackingCode: `DL-MUM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            status: ShipmentStatus.PLANNED,
          },
        });
        if (hardwareItems[0]?.productId) {
          await tx.shipmentItem.create({
            data: { shipmentId: shp2.id, productId: hardwareItems[0].productId, quantity: 5 },
          });
        }
      }
    }

    // 5. Update quotation status to ACCEPTED
    await tx.quotation.update({
      where: { id: quote.id },
      data: {
        status: QuotationStatus.ACCEPTED,
        currentStage: "Fulfillment Confirmed",
      },
    });

    // 6. Record Audit Log
    await tx.auditLog.create({
      data: {
        entity: "Order",
        entityId: order.id,
        action: "CONFIRM_FULFILLMENT_PLAN",
        fromState: "Ready for Fulfillment",
        toState: "Plan Confirmed",
        metadata: {
          orderNumber: order.orderNumber,
          quotationNumber: quote.quotationNumber,
          customerName: quote.customer.name,
        },
      },
    });

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  });
}
