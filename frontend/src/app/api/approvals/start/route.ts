import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quotationId } = body;

    const quote = await prisma.quotation.findFirst({
      where: { OR: [{ id: quotationId }, { quotationNumber: quotationId }] },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/approvals/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId: quote.id }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback
    }

    // Update quote status to IN_REVIEW
    await prisma.quotation.update({
      where: { id: quote.id },
      data: {
        status: "IN_REVIEW",
        currentStage: "Manager Review",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Approval workflow initiated",
      workflowId: `wf-${quote.id}`,
    });
  } catch (error) {
    console.error("[API start approval POST] Error:", error);
    return NextResponse.json({ error: "Failed to start workflow" }, { status: 500 });
  }
}
