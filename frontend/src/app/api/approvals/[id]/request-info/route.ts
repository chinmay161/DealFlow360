import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const query = body.query || body.comments || "Clarification requested by Manager";

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
        // Record in approval history
        await prisma.approvalHistory.create({
          data: {
            approvalId: approval.id,
            eventType: "INFO_REQUESTED",
            message: query,
          },
        }).catch(() => {});

        // Update active workflow step notes
        const activeStep = approval.workflowSteps.find(
          (s) => s.status === "IN_PROGRESS" || s.status === "PENDING"
        );
        if (activeStep) {
          await prisma.approvalWorkflowStep.update({
            where: { id: activeStep.id },
            data: {
              notes: `[Info Requested]: ${query}`,
            },
          }).catch(() => {});
        }
      }

      await prisma.quotation.update({
        where: { id: quote.id },
        data: {
          currentStage: "Information Requested",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Information request sent to deal owner",
      });
    }

    // 2. Try resolving as Approval record
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: { quotation: true, workflowSteps: true },
    });

    if (approval) {
      await prisma.approvalHistory.create({
        data: {
          approvalId: approval.id,
          eventType: "INFO_REQUESTED",
          message: query,
        },
      }).catch(() => {});

      if (approval.quotationId) {
        await prisma.quotation.update({
          where: { id: approval.quotationId },
          data: { currentStage: "Information Requested" },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: "Information request sent to deal owner",
      });
    }

    // 3. Fallback: Step
    const step = await prisma.approvalWorkflowStep.findUnique({
      where: { id },
      include: { approval: { include: { quotation: true } } },
    });

    if (step) {
      await prisma.approvalWorkflowStep.update({
        where: { id: step.id },
        data: { notes: `[Info Requested]: ${query}` },
      });

      await prisma.approvalHistory.create({
        data: {
          approvalId: step.approvalId,
          eventType: "INFO_REQUESTED",
          message: query,
        },
      }).catch(() => {});

      if (step.approval?.quotationId) {
        await prisma.quotation.update({
          where: { id: step.approval.quotationId },
          data: { currentStage: "Information Requested" },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: "Information request sent to deal owner",
      });
    }

    return NextResponse.json(
      { error: `Could not find quotation, approval, or workflow step with identifier ${id}` },
      { status: 404 }
    );
  } catch (error) {
    console.error("[API request-info] Error:", error);
    return NextResponse.json({ error: "Failed to process information request" }, { status: 500 });
  }
}
