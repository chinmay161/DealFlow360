import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.trim();
    const riskLevel = searchParams.get("riskLevel")?.trim();
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (riskLevel && riskLevel !== "ALL") {
      if (riskLevel === "LOW") {
        where.riskScore = { lte: 30 };
      } else if (riskLevel === "MEDIUM") {
        where.riskScore = { gt: 30, lte: 70 };
      } else if (riskLevel === "HIGH") {
        where.riskScore = { gt: 70 };
      }
    }

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    let orderBy: any = { createdAt: sortOrder };
    if (sortBy === "amount") {
      orderBy = { totalValue: sortOrder };
    } else if (sortBy === "riskScore") {
      orderBy = { riskScore: sortOrder };
    } else if (sortBy === "quoteNumber") {
      orderBy = { quotationNumber: sortOrder };
    }

    const [total, quotations] = await Promise.all([
      prisma.quotation.count({ where }),
      prisma.quotation.findMany({
        where,
        include: {
          customer: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
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
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const serialized = quotations.map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      customerId: q.customerId,
      customer: {
        id: q.customer.id,
        name: q.customer.name,
        industry: q.customer.industry,
        tier: q.customer.tier,
        paymentTerms: q.customer.paymentTerms,
        creditLimit: Number(q.customer.creditLimit),
        creditAvailable: Number(q.customer.creditAvailable),
      },
      ownerId: q.ownerId,
      owner: q.owner,
      status: q.status,
      currentStage: q.currentStage,
      currency: q.currency,
      subtotal: Number(q.subtotal),
      discountTotal: Number(q.discountTotal),
      taxTotal: Number(q.taxTotal),
      totalValue: Number(q.totalValue),
      estimatedMargin: Number(q.estimatedMargin),
      riskScore: q.riskScore,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      lineItems: q.lineItems.map((item) => ({
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
      approvals: q.approvals?.map((app) => ({
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
    }));

    return NextResponse.json({
      quotations: serialized,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch (error) {
    console.error("[API quotations GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, lineItems = [], currency = "INR" } = body;

    if (!customerId) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }

    // Resolve owner (default to first Sales Rep in DB)
    const defaultOwner = await prisma.user.findFirst({
      where: { role: "SALES_REP" },
    });
    const ownerId = defaultOwner?.id || (await prisma.user.findFirst())?.id;

    if (!ownerId) {
      return NextResponse.json({ error: "No system user found to own quotation" }, { status: 500 });
    }

    // Generate unique sequential quote number
    const count = await prisma.quotation.count();
    const quotationNumber = `Q-${1040 + count + 1}`;

    // Compute line item values
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
      const taxRate = 18.0; // 18% standard GST
      const lineTax = lineNet * (taxRate / 100);
      const costPrice = unitPrice * 0.65; // ~35% base margin
      const lineCost = qty * costPrice;
      const lineMargin = lineNet - lineCost;
      const marginPct = lineNet > 0 ? (lineMargin / lineNet) * 100 : 0;

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;
      totalCost += lineCost;

      preparedLines.push({
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

    const netValue = subtotal - discountTotal;
    const totalValue = netValue + taxTotal;
    const overallMargin = netValue > 0 ? ((netValue - totalCost) / netValue) * 100 : 30;

    // Simple deterministic risk score calculation (0 - 100)
    let calculatedRisk = 15; // baseline low risk
    if (overallMargin < 20) calculatedRisk += 30;
    if (discountTotal > subtotal * 0.15) calculatedRisk += 25;
    if (totalValue > 500000) calculatedRisk += 15;
    calculatedRisk = Math.min(95, Math.max(10, calculatedRisk));

    // Create quotation transactionally
    const createdQuotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        ownerId,
        status: "DRAFT",
        currentStage: "Draft Creation",
        currency,
        subtotal: new Decimal(subtotal.toFixed(2)),
        discountTotal: new Decimal(discountTotal.toFixed(2)),
        taxTotal: new Decimal(taxTotal.toFixed(2)),
        totalValue: new Decimal(totalValue.toFixed(2)),
        estimatedMargin: new Decimal(overallMargin.toFixed(2)),
        riskScore: calculatedRisk,
        lineItems: {
          create: preparedLines,
        },
      },
      include: {
        customer: true,
        owner: { select: { id: true, name: true, email: true } },
        lineItems: true,
      },
    });

    return NextResponse.json(
      {
        id: createdQuotation.id,
        quotationNumber: createdQuotation.quotationNumber,
        status: createdQuotation.status,
        totalValue: Number(createdQuotation.totalValue),
        message: "Quotation created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API quotations POST] Error:", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}
