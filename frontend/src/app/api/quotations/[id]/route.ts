import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    // Support lookup by UUID id or quotationNumber (e.g. Q-1042)
    const quotation = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: decodedId }, { quotationNumber: decodedId }],
      },
      include: {
        customer: true,
        owner: { select: { id: true, name: true, email: true } },
        lineItems: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, costPrice: true, taxRate: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        approvals: {
          include: {
            workflowSteps: {
              include: { approver: { select: { name: true, email: true } } },
              orderBy: { stepOrder: "asc" },
            },
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const serialized = {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      customer: {
        id: quotation.customer.id,
        name: quotation.customer.name,
        industry: quotation.customer.industry,
        tier: quotation.customer.tier,
        paymentTerms: quotation.customer.paymentTerms,
        creditLimit: Number(quotation.customer.creditLimit),
        creditAvailable: Number(quotation.customer.creditAvailable),
      },
      ownerId: quotation.ownerId,
      owner: quotation.owner,
      status: quotation.status,
      currentStage: quotation.currentStage,
      currency: quotation.currency,
      subtotal: Number(quotation.subtotal),
      discountTotal: Number(quotation.discountTotal),
      taxTotal: Number(quotation.taxTotal),
      totalValue: Number(quotation.totalValue),
      estimatedMargin: Number(quotation.estimatedMargin),
      riskScore: quotation.riskScore,
      createdAt: quotation.createdAt.toISOString(),
      updatedAt: quotation.updatedAt.toISOString(),
      lineItems: quotation.lineItems.map((item) => ({
        id: item.id,
        quotationId: item.quotationId,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountPercent: Number(item.discountPercent),
        discountLimitPercent: item.discountLimitPercent ? Number(item.discountLimitPercent) : null,
        estimatedMarginPercent: item.estimatedMarginPercent ? Number(item.estimatedMarginPercent) : null,
        lineTotal: Number(item.lineTotal),
        governanceStatus: item.governanceStatus,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      approvals: quotation.approvals?.map((app) => ({
        id: app.id,
        status: app.status,
        priority: app.priority,
        workflowSteps: app.workflowSteps.map((s) => ({
          id: s.id,
          stepOrder: s.stepOrder,
          stepName: s.role,
          status: s.status,
          approver: s.approver,
          decidedAt: s.completedAt?.toISOString() ?? null,
          comments: s.notes,
        })),
      })),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("[API quotation GET detail] Error:", error);
    return NextResponse.json({ error: "Failed to fetch quotation" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const body = await req.json();
    const { lineItems, customerId } = body;

    const existing = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: decodedId }, { quotationNumber: decodedId }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft quotations can be edited." },
        { status: 400 }
      );
    }

    // Replace line items and recalculate
    if (Array.isArray(lineItems)) {
      await prisma.quoteLineItem.deleteMany({
        where: { quotationId: existing.id },
      });

      let subtotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;
      let totalCost = 0;

      const preparedLines = [];

      for (const item of lineItems) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const unitPrice = Number(item.unitPrice) || 0;
        const discountPct = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
        const lineSubtotal = qty * unitPrice;
        const lineDiscount = lineSubtotal * (discountPct / 100);
        const lineNet = lineSubtotal - lineDiscount;
        const taxRate = 18.0;
        const lineTax = lineNet * (taxRate / 100);
        const costPrice = unitPrice * 0.65;
        const lineCost = qty * costPrice;
        const lineMargin = lineNet - lineCost;
        const marginPct = lineNet > 0 ? (lineMargin / lineNet) * 100 : 0;

        subtotal += lineSubtotal;
        discountTotal += lineDiscount;
        taxTotal += lineTax;
        totalCost += lineCost;

        preparedLines.push({
          quotationId: existing.id,
          productId: item.productId || null,
          productName: item.productName || "Custom Product",
          sku: item.sku || "CUSTOM-SKU",
          quantity: qty,
          unitPrice: new Decimal(unitPrice.toFixed(2)),
          discountPercent: new Decimal(discountPct.toFixed(2)),
          discountLimitPercent: new Decimal("15.00"),
          estimatedMarginPercent: new Decimal(marginPct.toFixed(2)),
          lineTotal: new Decimal(lineNet.toFixed(2)),
          governanceStatus: discountPct > 15 ? "FLAGGED_HIGH_DISCOUNT" : "AUTO_APPROVED",
        });
      }

      await prisma.quoteLineItem.createMany({
        data: preparedLines,
      });

      const netValue = subtotal - discountTotal;
      const totalValue = netValue + taxTotal;
      const overallMargin = netValue > 0 ? ((netValue - totalCost) / netValue) * 100 : 30;

      let calculatedRisk = 15;
      if (overallMargin < 20) calculatedRisk += 30;
      if (discountTotal > subtotal * 0.15) calculatedRisk += 25;
      if (totalValue > 500000) calculatedRisk += 15;
      calculatedRisk = Math.min(95, Math.max(10, calculatedRisk));

      const updated = await prisma.quotation.update({
        where: { id: existing.id },
        data: {
          customerId: customerId || existing.customerId,
          subtotal: new Decimal(subtotal.toFixed(2)),
          discountTotal: new Decimal(discountTotal.toFixed(2)),
          taxTotal: new Decimal(taxTotal.toFixed(2)),
          totalValue: new Decimal(totalValue.toFixed(2)),
          estimatedMargin: new Decimal(overallMargin.toFixed(2)),
          riskScore: calculatedRisk,
        },
      });

      return NextResponse.json({
        id: updated.id,
        quotationNumber: updated.quotationNumber,
        totalValue: Number(updated.totalValue),
        message: "Quotation updated successfully",
      });
    }

    return NextResponse.json({ message: "No changes provided" });
  } catch (error) {
    console.error("[API quotation PUT] Error:", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    const existing = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: decodedId }, { quotationNumber: decodedId }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft quotations can be deleted." },
        { status: 400 }
      );
    }

    await prisma.quotation.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Quotation deleted" });
  } catch (error) {
    console.error("[API quotation DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 });
  }
}
