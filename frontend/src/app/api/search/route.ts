import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getAuthoritativeCustomerForSession } from "@/lib/services/portalAuthService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    const isCustomer = user?.role === "CUSTOMER";
    const isSalesRep = user?.role === "SALES_REP";
    const authCustomer = isCustomer ? await getAuthoritativeCustomerForSession(user) : null;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    let quoteWhere: any;
    if (isCustomer && authCustomer) {
      quoteWhere = {
        customerId: authCustomer.id,
        quotationNumber: { contains: query, mode: "insensitive" },
      };
    } else if (isSalesRep && user?.id) {
      quoteWhere = {
        AND: [
          {
            OR: [
              { quotationNumber: { contains: query, mode: "insensitive" } },
              { customer: { name: { contains: query, mode: "insensitive" } } },
              { customer: { customerNumber: { contains: query, mode: "insensitive" } } },
            ],
          },
          {
            OR: [
              { customer: { ownerId: user.id } },
              { customer: { ownerId: null }, ownerId: user.id },
            ],
          },
        ],
      };
    } else {
      quoteWhere = {
        OR: [
          { quotationNumber: { contains: query, mode: "insensitive" } },
          { customer: { name: { contains: query, mode: "insensitive" } } },
          { customer: { customerNumber: { contains: query, mode: "insensitive" } } },
        ],
      };
    }

    const customerWhere: any = isSalesRep && user?.id
      ? {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { industry: { contains: query, mode: "insensitive" } },
                { customerNumber: { contains: query, mode: "insensitive" } },
              ],
            },
            {
              OR: [
                { ownerId: user.id },
                { ownerId: null },
              ],
            },
          ],
        }
      : {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { industry: { contains: query, mode: "insensitive" } },
            { customerNumber: { contains: query, mode: "insensitive" } },
          ],
        };

    const [quotations, products, customers] = await Promise.all([
      prisma.quotation.findMany({
        where: quoteWhere,
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
      isCustomer
        ? Promise.resolve([]) // Never expose other customer organizations to CUSTOMER role
        : prisma.customer.findMany({
            where: customerWhere,
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
        url: isCustomer ? `/portal/quotations/${q.id}` : `/quotations/${q.id}`,
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
        url: `/quotations/new?productId=${p.id}`,
        badge: "Product",
      });
    });

    // Map customers (only for internal staff)
    if (!isCustomer) {
      customers.forEach((c) => {
        results.push({
          id: `c-${c.id}`,
          type: "customer",
          title: c.name,
          subtitle: `${c.industry || "Enterprise"} • ${c.tier} Tier • Available Credit ₹${Number(c.creditAvailable).toLocaleString()}`,
          url: `/quotations/new?customerId=${c.id}`,
          badge: `${c.tier} Tier`,
        });
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[API search GET] Error:", error);
    return NextResponse.json({ error: "Search query failed" }, { status: 500 });
  }
}
