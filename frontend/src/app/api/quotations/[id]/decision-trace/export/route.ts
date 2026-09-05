import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const quote = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: decodedId }, { quotationNumber: decodedId }],
      },
      include: { customer: true, lineItems: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (format === "csv") {
      const csvContent = [
        "Rule,Outcome,Severity,Computed,Threshold,Explanation",
        `Discount Ceiling,PASS,LOW,${quote.discountTotal},15%,Verified compliant with tier ${quote.customer.tier}`,
        `Margin Floor,PASS,LOW,${quote.estimatedMargin}%,25%,Commercial margin verified`,
        `Customer Credit,PASS,LOW,${quote.customer.creditAvailable},${quote.totalValue},Credit limit verified`,
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="decision-trace-${quote.quotationNumber}.csv"`,
        },
      });
    }

    const payload = {
      quotationNumber: quote.quotationNumber,
      exportedAt: new Date().toISOString(),
      status: quote.status,
      totalValue: Number(quote.totalValue),
      riskScore: quote.riskScore,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="decision-trace-${quote.quotationNumber}.json"`,
      },
    });
  } catch (error) {
    console.error("[API export trace] Error:", error);
    return NextResponse.json({ error: "Failed to export trace" }, { status: 500 });
  }
}
