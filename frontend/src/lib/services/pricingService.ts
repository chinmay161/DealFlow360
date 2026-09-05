import { prisma } from "@/lib/prisma";
import { CustomerTier } from "@prisma/client";
import { convertFromINR } from "@/lib/currency";

export interface ResolvedPricing {
  productId: string;
  sku: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  priceListCode: string;
}

export async function resolveProductPriceForCustomer(
  customerId: string,
  productId: string,
  currency: string = "INR"
): Promise<ResolvedPricing> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, tier: true },
  });

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Determine target price list code by tier
  let targetPriceListCode = "STD-2026";
  if (customer?.tier === CustomerTier.PLATINUM) {
    targetPriceListCode = "ENT-2026";
  } else if (customer?.tier === CustomerTier.GOLD) {
    targetPriceListCode = "GOLD-2026";
  }

  const priceList = await prisma.priceList.findFirst({
    where: { code: targetPriceListCode, isActive: true },
    include: {
      items: {
        where: { productId },
      },
    },
  });

  const priceItem = priceList?.items[0];
  const rawUnitPrice = priceItem ? Number(priceItem.price) : Number(product.unitPrice);
  const rawCostPrice = Number(product.costPrice);

  const unitPrice = convertFromINR(rawUnitPrice, currency);
  const costPrice = convertFromINR(rawCostPrice, currency);

  return {
    productId: product.id,
    sku: product.sku,
    productName: product.name,
    unitPrice,
    costPrice,
    taxRate: Number(product.taxRate),
    priceListCode: priceList?.code || "DEFAULT",
  };
}
