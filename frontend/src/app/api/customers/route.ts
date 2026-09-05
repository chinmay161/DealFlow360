import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: 50,
    });

    const serialized = customers.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      tier: c.tier,
      paymentTerms: c.paymentTerms,
      creditLimit: Number(c.creditLimit),
      creditAvailable: Number(c.creditAvailable),
      territory: c.territory,
      ownerId: c.ownerId,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("[API customers] Error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
