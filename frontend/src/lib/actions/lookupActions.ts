"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAuthoritativeCustomerForSession } from "@/lib/services/portalAuthService";

export async function getActiveProductsAction() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      inventoryItems: {
        include: { warehouse: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => {
    const isDigital =
      p.category?.name === "Software" ||
      p.category?.name === "Services" ||
      p.category?.name === "Cloud" ||
      p.category?.name === "Support" ||
      p.category?.name === "Subscription" ||
      p.sku.startsWith("SW-") ||
      p.sku.startsWith("SRV-") ||
      p.sku.startsWith("SVC-") ||
      p.sku.startsWith("SEC-AUDIT");

    const inventorySum = p.inventoryItems.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
    const totalStock = isDigital ? 9999 : (inventorySum > 0 ? inventorySum : 120);

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      categoryName: p.category?.name || "General",
      unitPrice: Number(p.unitPrice),
      costPrice: Number(p.costPrice),
      taxRate: Number(p.taxRate),
      totalStock,
      isDigital,
    };
  });
}

export async function getCustomersAction() {
  const currentUser = await getCurrentUser();
  if (currentUser?.role === "CUSTOMER") {
    // If customer role, strictly return only their own organization
    const authCustomer = await getAuthoritativeCustomerForSession(currentUser);
    if (!authCustomer) return [];

    const full = await prisma.customer.findUnique({
      where: { id: authCustomer.id },
      include: {
        contacts: true,
        owner: true,
      },
    });

    if (!full) return [];

    return [{
      id: full.id,
      customerNumber: full.customerNumber,
      name: full.name,
      externalAccountId: full.externalAccountId,
      industry: full.industry,
      tier: full.tier,
      paymentTerms: full.paymentTerms,
      creditLimit: Number(full.creditLimit),
      creditAvailable: Number(full.creditAvailable),
      territory: full.territory,
      city: full.city,
      state: full.state,
      country: full.country,
      primaryContact: full.contacts.find((cnt) => cnt.isPrimary) || full.contacts[0] || null,
    }];
  }

  const customers = await prisma.customer.findMany({
    include: {
      contacts: true,
      owner: true,
    },
    orderBy: { name: "asc" },
  });

  return customers.map((c) => ({
    id: c.id,
    customerNumber: c.customerNumber,
    name: c.name,
    externalAccountId: c.externalAccountId,
    industry: c.industry,
    tier: c.tier,
    paymentTerms: c.paymentTerms,
    creditLimit: Number(c.creditLimit),
    creditAvailable: Number(c.creditAvailable),
    territory: c.territory,
    city: c.city,
    state: c.state,
    country: c.country,
    primaryContact: c.contacts.find((cnt) => cnt.isPrimary) || c.contacts[0] || null,
  }));
}

export async function getRecommendationsForQuoteAction(quotationId: string) {
  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { lineItems: true },
  });

  if (!quote) return [];

  const productIds = quote.lineItems
    .map((li) => li.productId)
    .filter((id): id is string => Boolean(id));

  const recs = await prisma.productRecommendation.findMany({
    where: {
      sourceProductId: { in: productIds },
    },
    include: {
      sourceProduct: true,
      targetProduct: true,
    },
    orderBy: { confidenceScore: "desc" },
    take: 3,
  });

  // If not enough direct recommendations, fetch top recommendations overall
  if (recs.length < 3) {
    const fallback = await prisma.productRecommendation.findMany({
      include: {
        sourceProduct: true,
        targetProduct: true,
      },
      orderBy: { confidenceScore: "desc" },
      take: 3,
    });
    return fallback.map((r) => ({
      id: r.id,
      sourceSku: r.sourceProduct.sku,
      targetSku: r.targetProduct.sku,
      targetProductId: r.targetProduct.id,
      title: r.targetProduct.name,
      type: r.recommendationType,
      confidenceScore: Number(r.confidenceScore),
      marginGain: Number(r.estimatedMarginGain ?? 0),
      unitPrice: Number(r.targetProduct.unitPrice),
      description: `Frequently purchased with ${r.sourceProduct.name} (${r.confidenceScore}% attach rate in Gold accounts).`,
    }));
  }

  return recs.map((r) => ({
    id: r.id,
    sourceSku: r.sourceProduct.sku,
    targetSku: r.targetProduct.sku,
    targetProductId: r.targetProduct.id,
    title: r.targetProduct.name,
    type: r.recommendationType,
    confidenceScore: Number(r.confidenceScore),
    marginGain: Number(r.estimatedMarginGain ?? 0),
    unitPrice: Number(r.targetProduct.unitPrice),
    description: `Frequently purchased with ${r.sourceProduct.name} (${r.confidenceScore}% attach rate in Gold accounts).`,
  }));
}
