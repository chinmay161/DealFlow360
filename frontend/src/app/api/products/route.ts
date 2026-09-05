import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId")?.trim();

    const where: any = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    const serialized = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      categoryId: p.categoryId,
      unitPrice: Number(p.unitPrice),
      costPrice: Number(p.costPrice),
      taxRate: Number(p.taxRate),
      unit: p.unit,
      isActive: p.isActive,
      category: p.category,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("[API products] Error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
