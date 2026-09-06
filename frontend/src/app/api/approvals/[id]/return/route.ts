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
            status: "PENDING",
            notes: comments || "Returned for revision by Manager",
          },
        });

        await prisma.approval.update({
          where: { id: approval.id },
          data: {
            status: "CANCELLED",
          },
        });

        await prisma.approvalHistory.create({
          data: {
            approvalId: approval.id,
            eventType: "RETURNED",
            message: comments || "Returned for revision by Manager",
          },
        }).catch(() => {});
      }

      await prisma.quotation.update({
        where: { id: quote.id },
        data: {
          status: "DRAFT",
          currentStage: "Returned for Revision",
        },
      });

      return NextResponse.json({ success: true, message: "Quotation returned for revision" });
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
          status: "PENDING",
          notes: comments || "Returned for revision",
        },
      });

      await prisma.approval.update({
        where: { id: approval.id },
        data: { status: "CANCELLED" },
      });

      if (approval.quotationId) {
        await prisma.quotation.update({
          where: { id: approval.quotationId },
          data: { status: "DRAFT", currentStage: "Returned for Revision" },
        });
      }

      await prisma.approvalHistory.create({
        data: {
          approvalId: approval.id,
          eventType: "RETURNED",
          message: comments || "Returned for revision",
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Quotation returned for revision" });
    }

    // 3. Fallback: Step
    const step = await prisma.approvalWorkflowStep.findUnique({
      where: { id },
      include: { approval: true },
    });

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
        data: { status: "CANCELLED" },
      });

      if (step.approval?.quotationId) {
        await prisma.quotation.update({
          where: { id: step.approval.quotationId },
          data: { status: "DRAFT", currentStage: "Returned for Revision" },
        });
      }

      return NextResponse.json({ success: true, message: "Step returned for revision" });
    }

    return NextResponse.json({ error: "No matching quotation or approval step found" }, { status: 404 });
  } catch (error) {
    console.error("[API return POST] Error:", error);
    return NextResponse.json({ error: "Failed to return step" }, { status: 500 });
  }
}
