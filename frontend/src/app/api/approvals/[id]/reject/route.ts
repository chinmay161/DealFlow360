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
      const resp = await fetch(`${BACKEND_URL}/api/v1/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });
      if (resp.ok) {
        return NextResponse.json({ success: true, message: "Step rejected in backend" });
      }
    } catch {
      // fallback
    }

    const step = await prisma.approvalWorkflowStep.findUnique({ where: { id } }).catch(() => null);
    if (step) {
      await prisma.approvalWorkflowStep.update({
        where: { id },
        data: {
          status: "REJECTED",
          notes: comments || "Rejected",
          completedAt: new Date(),
        },
      });

      await prisma.approval.update({
        where: { id: step.approvalId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ success: true, message: "Rejection recorded successfully" });
  } catch (error) {
    console.error("[API reject POST] Error:", error);
    return NextResponse.json({ error: "Failed to reject step" }, { status: 500 });
  }
}
