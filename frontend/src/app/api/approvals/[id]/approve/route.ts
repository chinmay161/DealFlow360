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
          { error: "Forbidden: You are not authorized to approve quotations" },
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
            status: "APPROVED",
            notes: comments || "Approved by Manager",
            completedAt: new Date(),
          },
        });

        await prisma.approval.update({
          where: { id: approval.id },
          data: {
            status: "APPROVED",
            resolvedAt: new Date(),
          },
        });

        await prisma.approvalHistory.create({
          data: {
            approvalId: approval.id,
            eventType: "APPROVED",
            message: comments ? `Approved by Manager: ${comments}` : "Approved by Manager",
          },
        }).catch(() => {});
      }

      await prisma.quotation.update({
        where: { id: quote.id },
        data: {
          status: "APPROVED",
          currentStage: "Approved",
        },
      });

      return NextResponse.json({ success: true, message: "Quotation approved successfully" });
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
          status: "APPROVED",
          notes: comments || "Approved by Manager",
          completedAt: new Date(),
        },
      });

      await prisma.approval.update({
        where: { id: approval.id },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
        },
      });

      if (approval.quotationId) {
        await prisma.quotation.update({
          where: { id: approval.quotationId },
          data: {
            status: "APPROVED",
            currentStage: "Approved",
          },
        });
      }

      await prisma.approvalHistory.create({
        data: {
          approvalId: approval.id,
          eventType: "APPROVED",
          message: comments ? `Approved by Manager: ${comments}` : "Approved by Manager",
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Approval recorded successfully" });
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
          status: "APPROVED",
          notes: comments || "Approved",
          completedAt: new Date(),
        },
      });

      // Check if other steps in this approval are still pending
      const remainingSteps = await prisma.approvalWorkflowStep.findMany({
        where: {
          approvalId: step.approvalId,
          id: { not: step.id },
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      });

      const parentApproval = await prisma.approval.findUnique({
        where: { id: step.approvalId },
      });

      if (remainingSteps.length === 0) {
        // All steps completed: Final approval granted
        await prisma.approval.update({
          where: { id: step.approvalId },
          data: { status: "APPROVED", resolvedAt: new Date() },
        });

        if (parentApproval?.quotationId) {
          await prisma.quotation.update({
            where: { id: parentApproval.quotationId },
            data: {
              status: "APPROVED",
              currentStage: "Approved",
            },
          });
        }
      } else {
        // Multi-stage progression: Activate next step
        const nextStep = remainingSteps.sort((a, b) => a.stepOrder - b.stepOrder)[0];
        await prisma.approvalWorkflowStep.update({
          where: { id: nextStep.id },
          data: { status: "IN_PROGRESS" },
        });
        await prisma.approval.update({
          where: { id: step.approvalId },
          data: {
            currentStep: nextStep.stepOrder,
            assignedToId: nextStep.approverId,
          },
        });
        if (parentApproval?.quotationId) {
          await prisma.quotation.update({
            where: { id: parentApproval.quotationId },
            data: {
              currentStage: nextStep.role.includes("Finance") ? "Finance Review" : "Manager Approval",
            },
          });
        }
      }

      return NextResponse.json({ success: true, message: "Step approved successfully" });
    }

    return NextResponse.json({ error: "No matching quotation or approval step found" }, { status: 404 });
  } catch (error) {
    console.error("[API approve POST] Error:", error);
    return NextResponse.json({ error: "Failed to approve step" }, { status: 500 });
  }
}
