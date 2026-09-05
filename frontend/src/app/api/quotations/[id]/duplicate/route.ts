import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    const original = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: decodedId }, { quotationNumber: decodedId }],
      },
      include: {
        lineItems: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Original quotation not found" }, { status: 404 });
    }

    const count = await prisma.quotation.count();
    const newNumber = `Q-${1040 + count + 1}`;

    const duplicate = await prisma.quotation.create({
      data: {
        quotationNumber: newNumber,
        customerId: original.customerId,
        ownerId: original.ownerId,
        status: "DRAFT",
        currentStage: "Draft Creation",
        currency: original.currency,
        subtotal: original.subtotal,
        discountTotal: original.discountTotal,
        taxTotal: original.taxTotal,
        totalValue: original.totalValue,
        estimatedMargin: original.estimatedMargin,
        riskScore: original.riskScore,
        lineItems: {
          create: original.lineItems.map((item) => ({
            productId: item.productId,
            productName: `${item.productName} (Copy)`,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountLimitPercent: item.discountLimitPercent,
            estimatedMarginPercent: item.estimatedMarginPercent,
            lineTotal: item.lineTotal,
            governanceStatus: item.governanceStatus,
          })),
        },
      },
    });

    return NextResponse.json({
      id: duplicate.id,
      quotationNumber: duplicate.quotationNumber,
      message: "Quotation duplicated successfully",
    });
  } catch (error) {
    console.error("[API duplicate POST] Error:", error);
    return NextResponse.json({ error: "Failed to duplicate quotation" }, { status: 500 });
  }
}
