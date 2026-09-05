import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { comments } = body;

    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/approvals/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });
      if (resp.ok) {
        return NextResponse.json({ success: true, message: "Returned for revision in backend" });
      }
    } catch {
      // fallback
    }

    const step = await prisma.approvalWorkflowStep.findUnique({ where: { id } }).catch(() => null);
    if (step) {
      await prisma.approvalWorkflowStep.update({
        where: { id },
        data: {
          status: "PENDING",
          notes: comments || "Returned for revision",
        },
      });

      await prisma.approval.update({
        where: { id: step.approvalId },
        data: { status: "PENDING" },
      });
    }

    return NextResponse.json({ success: true, message: "Quotation returned for revision" });
  } catch (error) {
    console.error("[API return POST] Error:", error);
    return NextResponse.json({ error: "Failed to return step" }, { status: 500 });
  }
}
