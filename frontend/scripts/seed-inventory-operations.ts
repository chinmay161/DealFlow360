import { OrderStatus, ShipmentStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Starting operational seed for Inventory & Visibility module...");

  // Fetch warehouses
  const warehouses = await prisma.warehouse.findMany();
  if (warehouses.length === 0) {
    console.error("No warehouses found in database. Please run prisma/seed.ts first.");
    return;
  }

  const bomWh = warehouses.find((w) => w.code === "WH-BOM") || warehouses[0];
  const blrWh = warehouses.find((w) => w.code === "WH-BLR") || warehouses[1] || warehouses[0];
  const delWh = warehouses.find((w) => w.code === "WH-DEL") || warehouses[2] || warehouses[0];

  // Fetch products
  const products = await prisma.product.findMany();
  if (products.length === 0) {
    console.error("No products found in database.");
    return;
  }

  const laptop = products.find((p) => p.sku === "HW-LP14") || products[0];
  const display = products.find((p) => p.sku === "DSP27") || products[1] || products[0];
  const dock = products.find((p) => p.sku === "ACC-TB4-DK") || products[2] || products[0];
  const workstation = products.find((p) => p.sku === "HW-WS-Z8") || products[3] || products[0];
  const charger = products.find((p) => p.sku === "PWR-100W-2C") || products[4] || products[0];

  // Fetch approved quotations
  const approvedQuotes = await prisma.quotation.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      quotationNumber: true,
      customerId: true,
      totalValue: true,
      lineItems: true,
    },
  });

  const inReviewQuotes = await prisma.quotation.findMany({
    where: { status: "IN_REVIEW" },
    select: {
      id: true,
      quotationNumber: true,
      customerId: true,
      totalValue: true,
      lineItems: true,
    },
  });

  console.log(`Found ${approvedQuotes.length} approved quotes and ${inReviewQuotes.length} in-review quotes.`);

  // 1. Create orders for approved quotations if not existing
  for (let i = 0; i < approvedQuotes.length; i++) {
    const q = approvedQuotes[i];
    const orderNum = `ORD-${q.quotationNumber.replace("Q-", "")}`;

    let order = await prisma.order.findUnique({
      where: { orderNumber: orderNum },
    });

    if (!order) {
      order = await prisma.order.create({
        data: {
          orderNumber: orderNum,
          quotationId: q.id,
          customerId: q.customerId,
          status: i % 2 === 0 ? OrderStatus.IN_FULFILLMENT : OrderStatus.CONFIRMED,
          totalAmount: q.totalValue,
        },
      });
      console.log(`Created Order ${order.orderNumber} for quote ${q.quotationNumber}`);

      // Create OrderLines
      for (const line of q.lineItems) {
        if (line.productId) {
          await prisma.orderLine.create({
            data: {
              orderId: order.id,
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal,
              itemType: "PHYSICAL",
            },
          });
        }
      }
    }

    // 2. Create Reservations for this Order & Quote
    const existingRes = await prisma.inventoryReservation.findMany({
      where: { orderId: order.id },
    });

    if (existingRes.length === 0) {
      const targetWh = i % 3 === 0 ? bomWh : i % 3 === 1 ? blrWh : delWh;
      const targetProd = i % 2 === 0 ? laptop : display;

      await prisma.inventoryReservation.create({
        data: {
          orderId: order.id,
          quotationId: q.id,
          warehouseId: targetWh.id,
          productId: targetProd.id,
          quantity: 15 + i * 5,
          status: i === 0 ? "FULFILLED" : "CONFIRMED",
        },
      });

      if (dock) {
        await prisma.inventoryReservation.create({
          data: {
            orderId: order.id,
            quotationId: q.id,
            warehouseId: targetWh.id,
            productId: dock.id,
            quantity: 10 + i * 2,
            status: "CONFIRMED",
          },
        });
      }
      console.log(`Created reservations for order ${order.orderNumber}`);
    }

    // 3. Create Shipments for the Order
    const existingShipments = await prisma.shipment.findMany({
      where: { orderId: order.id },
    });

    if (existingShipments.length === 0) {
      const statuses: ShipmentStatus[] = [
        ShipmentStatus.SHIPPED,
        ShipmentStatus.PACKED,
        ShipmentStatus.READY,
        ShipmentStatus.DELIVERED,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.PLANNED,
      ];
      const shipStatus = statuses[i % statuses.length];
      const trackingCode = `EXP-IND-${10000 + i * 142}`;
      const targetWh = i % 2 === 0 ? bomWh : blrWh;

      const shipment = await prisma.shipment.create({
        data: {
          shipmentNumber: `SHP-${1000 + i}`,
          orderId: order.id,
          warehouseId: targetWh.id,
          carrier: i % 2 === 0 ? "Blue Dart Express" : "Delhivery Supply Chain",
          trackingCode,
          status: shipStatus,
          shippedAt: shipStatus === ShipmentStatus.SHIPPED || shipStatus === ShipmentStatus.IN_TRANSIT || shipStatus === ShipmentStatus.DELIVERED
            ? new Date(Date.now() - 3 * 24 * 3600 * 1000)
            : null,
          deliveredAt: shipStatus === ShipmentStatus.DELIVERED ? new Date(Date.now() - 1 * 24 * 3600 * 1000) : null,
        },
      });

      // Add ShipmentItem
      await prisma.shipmentItem.create({
        data: {
          shipmentId: shipment.id,
          productId: laptop.id,
          quantity: 15,
        },
      });

      if (charger) {
        await prisma.shipmentItem.create({
          data: {
            shipmentId: shipment.id,
            productId: charger.id,
            quantity: 25,
          },
        });
      }

      console.log(`Created shipment ${shipment.shipmentNumber} (${shipment.status}) for order ${order.orderNumber}`);
    }
  }

  // 4. Create pending/draft reservations for In-Review quotations
  for (let i = 0; i < inReviewQuotes.length; i++) {
    const q = inReviewQuotes[i];
    const existingQuoteRes = await prisma.inventoryReservation.findMany({
      where: { quotationId: q.id },
    });

    if (existingQuoteRes.length === 0) {
      const targetWh = i % 2 === 0 ? bomWh : delWh;
      await prisma.inventoryReservation.create({
        data: {
          quotationId: q.id,
          warehouseId: targetWh.id,
          productId: workstation.id,
          quantity: 5 + i * 2,
          status: "PENDING",
        },
      });
      console.log(`Created pending reservation for in-review quotation ${q.quotationNumber}`);
    }
  }

  const finalResCount = await prisma.inventoryReservation.count();
  const finalShipCount = await prisma.shipment.count();
  const finalOrderCount = await prisma.order.count();

  console.log("✅ Operational seeding completed successfully!");
  console.log(`   - Orders:       ${finalOrderCount}`);
  console.log(`   - Reservations: ${finalResCount}`);
  console.log(`   - Shipments:    ${finalShipCount}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
