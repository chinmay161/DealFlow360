import { prisma } from "@/lib/prisma";

export interface WarehouseStockInfo {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  productId: string;
  sku: string;
  available: number;
  reserved: number;
}

export async function getFulfillmentDetails(quoteNumber = "Q-1042") {
  const quote = await prisma.quotation.findUnique({
    where: { quotationNumber: quoteNumber },
    include: {
      customer: true,
      lineItems: {
        include: { product: true },
      },
    },
  });

  if (!quote) throw new Error(`Quotation ${quoteNumber} not found`);

  const warehouses = await prisma.warehouse.findMany({
    include: {
      inventory: {
        include: { product: true },
      },
    },
    orderBy: { code: "asc" },
  });

  return {
    orderNumber: `ORD-${quote.quotationNumber.replace("Q-", "")}`,
    quotationNumber: quote.quotationNumber,
    customerName: quote.customer.name,
    customerTerritory: quote.customer.territory,
    lineItems: quote.lineItems.map((li) => ({
      id: li.id,
      productId: li.productId,
      sku: li.sku || li.product?.sku || "N/A",
      name: li.productName,
      quantity: li.quantity,
      unitPrice: Number(li.unitPrice),
      total: Number(li.lineTotal),
    })),
    warehouses: warehouses.map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      location: w.location,
      inventory: w.inventory.map((inv) => ({
        productId: inv.productId,
        sku: inv.product.sku,
        productName: inv.product.name,
        available: inv.quantityAvailable,
        reserved: inv.quantityReserved,
      })),
    })),
  };
}

export async function reserveWarehouseInventory(params: {
  allocations: Array<{ warehouseId: string; productId: string; quantity: number }>;
}) {
  return await prisma.$transaction(async (tx) => {
    for (const alloc of params.allocations) {
      if (alloc.quantity <= 0) continue;

      const item = await tx.inventoryItem.findFirst({
        where: {
          warehouseId: alloc.warehouseId,
          productId: alloc.productId,
        },
      });

      if (!item) {
        throw new Error(`Inventory item not found for warehouse ${alloc.warehouseId} and product ${alloc.productId}`);
      }

      if (alloc.quantity > item.quantityAvailable) {
        throw new Error(
          `Over-allocation rejected: requested ${alloc.quantity} units, but only ${item.quantityAvailable} units available in warehouse.`
        );
      }

      await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantityAvailable: { decrement: alloc.quantity },
          quantityReserved: { increment: alloc.quantity },
        },
      });
    }

    return { success: true };
  });
}
