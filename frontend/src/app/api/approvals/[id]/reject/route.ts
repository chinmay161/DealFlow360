import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (session?.user) {
      const role = (session.user as any)?.role;
      if (role === "CUSTOMER" || role === "SALES_REP") {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to reject quotations" },
          { status: 403 }
        );
      }
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { comments } = body;

    // 1. Try resolving as Quotation (by UUID or quotationNumber)
    const quote = await prisma.quotation.findFirst({
      where: { OR: [{ id }, { quotationNumber: id }] },
      include: {
        approvals: {
          include: {
            workflowSteps: { orderBy: { stepOrder: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (quote) {
      const approval = quote.approvals[0];
      if (approval) {
        await prisma.approvalWorkflowStep.updateMany({
          where: {
            approvalId: approval.id,
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
          data: {
            status: "REJECTED",
            notes: comments || "Rejected by Manager",
            completedAt: new Date(),
          },
        });

        await prisma.approval.update({
          where: { id: approval.id },
          data: {
            status: "REJECTED",
            resolvedAt: new Date(),
          },
        });

        await prisma.approvalHistory.create({
          data: {
            approvalId: approval.id,
            eventType: "REJECTED",
            message: comments ? `Rejected by Manager: ${comments}` : "Rejected by Manager",
          },
        }).catch(() => {});
      }

      await prisma.quotation.update({
        where: { id: quote.id },
        data: {
          status: "REJECTED",
          currentStage: "Rejected",
        },
      });

      return NextResponse.json({ success: true, message: "Quotation rejected successfully" });
    }

    // 2. Try resolving as Approval record
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: { quotation: true },
    });

    if (approval) {
      await prisma.approvalWorkflowStep.updateMany({
        where: {
          approvalId: approval.id,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        data: {
          status: "REJECTED",
          notes: comments || "Rejected by Manager",
          completedAt: new Date(),
        },
      });

      await prisma.approval.update({
        where: { id: approval.id },
        data: {
          status: "REJECTED",
          resolvedAt: new Date(),
        },
      });

      if (approval.quotationId) {
        await prisma.quotation.update({
          where: { id: approval.quotationId },
          data: {
            status: "REJECTED",
            currentStage: "Rejected",
          },
        });
      }

      await prisma.approvalHistory.create({
        data: {
          approvalId: approval.id,
          eventType: "REJECTED",
          message: comments ? `Rejected by Manager: ${comments}` : "Rejected by Manager",
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Quotation rejected successfully" });
    }

    // 3. Fallback: Try resolving as ApprovalWorkflowStep
    const step = await prisma.approvalWorkflowStep.findUnique({
      where: { id },
      include: { approval: true },
    });

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
        data: {
          status: "REJECTED",
          resolvedAt: new Date(),
        },
      });

      if (step.approval?.quotationId) {
        await prisma.quotation.update({
          where: { id: step.approval.quotationId },
          data: {
            status: "REJECTED",
            currentStage: "Rejected",
          },
        });
      }

      return NextResponse.json({ success: true, message: "Step rejected successfully" });
    }

    return NextResponse.json({ error: "No matching quotation or approval step found" }, { status: 404 });
  } catch (error) {
    console.error("[API reject POST] Error:", error);
    return NextResponse.json({ error: "Failed to reject step" }, { status: 500 });
  }
}
