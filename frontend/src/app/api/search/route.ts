import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [quotations, products, customers] = await Promise.all([
      prisma.quotation.findMany({
        where: {
          OR: [
            { quotationNumber: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: { customer: { select: { name: true } } },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { industry: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
    ]);

    const results: any[] = [];

    // Map quotations
    quotations.forEach((q) => {
      results.push({
        id: `q-${q.id}`,
        type: "quotation",
        title: `Quotation #${q.quotationNumber}`,
        subtitle: `${q.customer.name} • ₹${Number(q.totalValue).toLocaleString()} • ${q.status}`,
        url: `/customer/quotations/${q.quotationNumber}`,
        badge: q.status,
      });
    });

    // Map products
    products.forEach((p) => {
      results.push({
        id: `p-${p.id}`,
        type: "product",
        title: p.name,
        subtitle: `SKU: ${p.sku} • ₹${Number(p.unitPrice).toLocaleString()}`,
        url: `/customer/quotations/new?productId=${p.id}`,
        badge: "Product",
      });
    });

    // Map customers
    customers.forEach((c) => {
      results.push({
        id: `c-${c.id}`,
        type: "customer",
        title: c.name,
        subtitle: `${c.industry || "Enterprise"} • ${c.tier} Tier • Available Credit ₹${Number(c.creditAvailable).toLocaleString()}`,
        url: `/customer/quotations/new?customerId=${c.id}`,
        badge: `${c.tier} Tier`,
      });
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[API search GET] Error:", error);
    return NextResponse.json({ error: "Search query failed" }, { status: 500 });
  }
}
