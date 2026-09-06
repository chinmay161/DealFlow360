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
    } else {
      const approval = await prisma.approval.findUnique({
        where: { id },
        include: { workflowSteps: true },
      });
      if (approval) {
        const { approveWorkflowStep } = await import("@/lib/services/approvalService");
        await approveWorkflowStep(approval.id, comments);
      }
    }

    return NextResponse.json({ success: true, message: "Approval recorded successfully" });
  } catch (error) {
    console.error("[API approve POST] Error:", error);
    return NextResponse.json({ error: "Failed to approve step" }, { status: 500 });
  }
}
