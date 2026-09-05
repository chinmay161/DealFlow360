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

    // Try forwarding to Backend
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });
      if (resp.ok) {
        return NextResponse.json({ success: true, message: "Step approved in backend" });
      }
    } catch {
      // fallback to database
    }

    // Update step or quotation in Prisma
    const step = await prisma.approvalWorkflowStep.findUnique({ where: { id } }).catch(() => null);
    if (step) {
      await prisma.approvalWorkflowStep.update({
        where: { id },
        data: {
          status: "APPROVED",
          notes: comments || "Approved",
          completedAt: new Date(),
        },
      });

      // Update parent approval
      await prisma.approval.update({
        where: { id: step.approvalId },
        data: { status: "APPROVED" },
      });
    }

    return NextResponse.json({ success: true, message: "Approval recorded successfully" });
  } catch (error) {
    console.error("[API approve POST] Error:", error);
    return NextResponse.json({ error: "Failed to approve step" }, { status: 500 });
  }
}
