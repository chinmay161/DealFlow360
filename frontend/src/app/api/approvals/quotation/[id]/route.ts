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
      where: { OR: [{ id: decodedId }, { quotationNumber: decodedId }] },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Try backend Approval Routing service
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/approvals/quotation/${quote.id}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback to Prisma workflow steps
    }

    // Fallback to database approval workflow
    const approval = await prisma.approval.findFirst({
      where: { quotationId: quote.id },
      include: {
        workflowSteps: {
          include: { approver: { select: { name: true, email: true } } },
          orderBy: { stepOrder: "asc" },
        },
      },
    });

    const defaultSteps = [
      {
        id: "step-1",
        stage: 1,
        stepName: "Quotation Submission",
        approverRole: "SALES_REP",
        approverName: "Sales Executive",
        status: "APPROVED" as const,
        decidedAt: quote.createdAt.toISOString(),
        comments: "Quote prepared and submitted for verification.",
      },
      {
        id: "step-2",
        stage: 2,
        stepName: "Sales Manager Review",
        approverRole: "MANAGER",
        approverName: "Sarah Manager",
        status: quote.status === "APPROVED" ? ("APPROVED" as const) : ("PENDING" as const),
        decidedAt: quote.status === "APPROVED" ? quote.updatedAt.toISOString() : null,
        comments: quote.status === "APPROVED" ? "Commercial discount and margin verified." : null,
      },
      {
        id: "step-3",
        stage: 3,
        stepName: "Finance & Credit Verification",
        approverRole: "FINANCE",
        approverName: "Frank Finance",
        status:
          quote.status === "APPROVED"
            ? ("APPROVED" as const)
            : (quote.riskScore ?? 0) > 65
            ? ("PENDING" as const)
            : ("SKIPPED" as const),
        decidedAt: quote.status === "APPROVED" ? quote.updatedAt.toISOString() : null,
        comments: quote.status === "APPROVED" ? "Customer credit line and payment terms approved." : null,
      },
    ];

    return NextResponse.json({
      quotationId: quote.id,
      currentStage: quote.currentStage || "Manager Review",
      status: quote.status,
      steps:
        approval && approval.workflowSteps.length > 0
          ? approval.workflowSteps.map((s) => ({
              id: s.id,
              stage: s.stepOrder,
              stepName: s.role,
              approverRole: s.role,
              approverName: s.approver?.name || s.approver?.email || "Designated Approver",
              status: s.status as any,
              decidedAt: s.completedAt?.toISOString() ?? null,
              comments: s.notes,
            }))
          : defaultSteps,
      canApprove: quote.status !== "APPROVED" && quote.status !== "REJECTED",
      canReject: quote.status !== "APPROVED" && quote.status !== "REJECTED",
      canReturn: quote.status !== "APPROVED" && quote.status !== "REJECTED",
    });
  } catch (error) {
    console.error("[API approvals/quotation GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch workflow status" }, { status: 500 });
  }
}
