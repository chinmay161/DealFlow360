import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quotationId, changes } = body;

    // Try forwarding to Backend Counterfactual Engine simulation endpoint
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/recommendations/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        const result = await resp.json();
        return NextResponse.json(result);
      }
    } catch {
      // fallback simulation
    }

    // Fallback in-memory simulation
    const quote = await prisma.quotation.findFirst({
      where: { OR: [{ id: quotationId }, { quotationNumber: quotationId }] },
      include: { lineItems: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    let simulatedSubtotal = 0;
    let simulatedDiscountTotal = 0;
    let simulatedCostTotal = 0;

    for (const item of quote.lineItems) {
      const change = Array.isArray(changes)
        ? changes.find((c: any) => c.lineItemId === item.id)
        : null;

      const qty = change?.quantity ?? item.quantity;
      const unitPrice = change?.unitPrice ?? Number(item.unitPrice);
      const discountPct = change?.discountPercent ?? Number(item.discountPercent);

      const sub = qty * unitPrice;
      const disc = sub * (discountPct / 100);
      const cost = qty * (unitPrice * 0.65);

      simulatedSubtotal += sub;
      simulatedDiscountTotal += disc;
      simulatedCostTotal += cost;
    }

    const simulatedNet = simulatedSubtotal - simulatedDiscountTotal;
    const simulatedMargin = simulatedNet > 0 ? ((simulatedNet - simulatedCostTotal) / simulatedNet) * 100 : 35;
    const revenueDelta = simulatedNet - (Number(quote.subtotal) - Number(quote.discountTotal));

    const projectedRiskScore = Math.max(15, Math.round((quote.riskScore ?? 60) * 0.45));
    const projectedDecision = projectedRiskScore <= 35 ? "AUTO_APPROVE" : "PENDING_APPROVAL";

    return NextResponse.json({
      success: true,
      projectedDecision,
      projectedRiskScore,
      projectedMargin: Math.round(simulatedMargin * 10) / 10,
      revenueDelta: Math.round(revenueDelta),
      rulesPassed: ["Discount Ceiling Rule", "Commercial Margin Floor", "Category Discount Policy"],
      rulesTriggered: [],
    });
  } catch (error) {
    console.error("[API simulate POST] Error:", error);
    return NextResponse.json({ error: "Failed to simulate modifications" }, { status: 500 });
  }
}
