import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { auth } from "@/auth";
import { getAuthoritativeCustomerForSession } from "@/lib/services/portalAuthService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let currentUser = null;
    try {
      const session = await auth();
      currentUser = session?.user;
    } catch {
      // Standalone execution outside Next.js request context
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.trim();
    const riskLevel = searchParams.get("riskLevel")?.trim();
    const scope = searchParams.get("scope")?.trim();
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));

    const where: any = {};

    if (currentUser?.role === "CUSTOMER") {
      const authCustomer = await getAuthoritativeCustomerForSession(currentUser);
      where.customerId = authCustomer?.id || currentUser.customerId;
    } else if ((scope === "mine" || scope === "assigned") && currentUser?.id) {
      where.OR = [
        { customer: { ownerId: currentUser.id } },
        { customer: { ownerId: null }, ownerId: currentUser.id },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (riskLevel && riskLevel !== "ALL") {
      const normalizedRisk = riskLevel.toUpperCase();
      if (normalizedRisk === "LOW" || normalizedRisk === "HEALTHY") {
        where.riskScore = { lt: 40 };
      } else if (normalizedRisk === "MEDIUM" || normalizedRisk === "ATTENTION") {
        where.riskScore = { gte: 40, lt: 70 };
      } else if (normalizedRisk === "HIGH" || normalizedRisk === "AT-RISK") {
        where.riskScore = { gte: 70 };
      }
    }

    if (search) {
      const searchCondition = [
        { quotationNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { customerNumber: { contains: search, mode: "insensitive" } } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
        { owner: { email: { contains: search, mode: "insensitive" } } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: searchCondition },
          { OR: where.OR },
        ];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
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
    let currentUser = null;
    try {
      const session = await auth();
      currentUser = session?.user;
    } catch {
      // Standalone execution outside Next.js request context
    }

    const body = await req.json();
    const { customerId: requestedCustomerId, currency = "INR" } = body;
    const rawLines = body.quotationLines ?? body.lineItems ?? [];

    if (!requestedCustomerId) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }

    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      return NextResponse.json(
        {
          error: "A quotation must contain at least one product.",
          message: "A quotation must contain at least one product.",
        },
        { status: 400 }
      );
    }

    const lineItems = rawLines;

    let targetCustomerId = requestedCustomerId;
    let targetOwnerId: string | null = null;

    if (currentUser?.role === "CUSTOMER") {
      const authCustomer = await getAuthoritativeCustomerForSession(currentUser);
      if (!authCustomer) {
        return NextResponse.json(
          { error: "Unauthorized: Customer organization profile could not be verified" },
          { status: 403 }
        );
      }
      if (requestedCustomerId && requestedCustomerId !== authCustomer.id) {
        return NextResponse.json(
          { error: "Unauthorized: Customer users cannot create quotations for other organizations" },
          { status: 403 }
        );
      }
      if (!authCustomer.ownerId) {
        return NextResponse.json(
          { error: "Cannot create quotation: Customer organization has no assigned internal account owner" },
          { status: 400 }
        );
      }
      targetCustomerId = authCustomer.id;
      targetOwnerId = authCustomer.ownerId;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: targetCustomerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (currentUser?.role === "CUSTOMER") {
      targetOwnerId = customer.ownerId;
    } else if (currentUser?.role === "SALES_REP") {
      if (customer.ownerId && customer.ownerId !== currentUser.id) {
        return NextResponse.json(
          { error: "Unauthorized: Sales Representatives can only create quotations for customers assigned to their account" },
          { status: 403 }
        );
      }
      targetOwnerId = customer.ownerId || currentUser.id;
    } else {
      targetOwnerId = customer.ownerId || currentUser?.id || null;
    }

    if (!targetOwnerId) {
      return NextResponse.json(
        { error: "Cannot create quotation: Customer organization has no assigned internal account owner" },
        { status: 400 }
      );
    }

    // Generate unique sequential quote number safely
    const existingQuotes = await prisma.quotation.findMany({
      select: { quotationNumber: true },
    });
    let maxNum = 1000;
    for (const q of existingQuotes) {
      const match = q.quotationNumber.match(/^Q-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const quotationNumber = `Q-${maxNum + 1}`;

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
        customerId: targetCustomerId,
        ownerId: targetOwnerId,
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

    // Create persistent AuditLog entry
    await prisma.auditLog
      .create({
        data: {
          entity: "Quotation",
          entityId: createdQuotation.id,
          action: "QUOTATION_CREATED",
          actorId: currentUser?.id || null,
          actorEmail: currentUser?.email || null,
          fromState: null,
          toState: "DRAFT",
          metadata: {
            role: currentUser?.role || "CUSTOMER",
            customerId: targetCustomerId,
            quotationNumber: createdQuotation.quotationNumber,
            creatorName: currentUser?.name || "Customer Representative",
          },
        },
      })
      .catch(() => null);

    // Revalidate paths for real-time consistency
    try {
      revalidatePath("/quotations", "layout");
      revalidatePath("/dashboard", "layout");
      revalidatePath("/customer/quotations", "layout");
      revalidatePath("/customer/dashboard", "layout");
      revalidatePath("/portal/quotations", "layout");
      revalidatePath(`/quotations/${createdQuotation.id}`);
      revalidatePath(`/customer/quotations/${createdQuotation.id}`);
    } catch {
      // Safe no-op outside Next.js request context
    }

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
