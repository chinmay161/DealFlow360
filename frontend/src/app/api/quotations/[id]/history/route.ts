import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    const quote = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: decodedId }, { quotationNumber: decodedId }],
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Try fetching from backend StateHistoryService first
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/quotations/${quote.id}/history`, {
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        const historyData = await resp.json();
        if (Array.isArray(historyData) && historyData.length > 0) {
          return NextResponse.json(historyData);
        }
      }
    } catch {
      // fallback to Prisma
    }

    // Fallback to local ApprovalHistory records in PostgreSQL
    const approvals = await prisma.approval.findMany({
      where: { quotationId: quote.id },
      include: {
        history: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const entries: any[] = [];

    for (const app of approvals) {
      for (const h of app.history) {
        entries.push({
          id: h.id,
          fromState: "DRAFT",
          toState: h.eventType,
          actorName: h.actor?.name || "System",
          actorRole: h.actor?.role || "SALES_REP",
          reason: h.message,
          createdAt: h.createdAt.toISOString(),
        });
      }
    }

    if (entries.length === 0) {
      entries.push({
        id: `init-${quote.id}`,
        fromState: "NONE",
        toState: quote.status,
        actorName: "Sales Operations",
        actorRole: "SALES_REP",
        reason: "Initial quotation generation",
        createdAt: quote.createdAt.toISOString(),
      });
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error("[API quotation history] Error:", error);
    return NextResponse.json({ error: "Failed to fetch quotation history" }, { status: 500 });
  }
}
