import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import {
  ApprovalStatus,
  ApprovalPriority,
  WorkflowStepStatus,
  QuotationStatus,
} from "@prisma/client";

export async function submitQuoteForApproval(quotationId: string, notes?: string) {
  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      owner: true,
      lineItems: true,
      approvals: {
        where: { status: ApprovalStatus.PENDING },
        include: { workflowSteps: true },
      },
    },
  });

  if (!quote) throw new Error(`Quotation ${quotationId} not found`);

  if (!quote.lineItems || quote.lineItems.length === 0) {
    throw new Error("A quotation must contain at least one product.");
  }

  // Check for existing pending approval
  if (quote.approvals.length > 0) {
    return quote.approvals[0];
  }

  // Find approvers
  const salesManager = await prisma.user.findFirst({
    where: { role: "MANAGER" },
  }) ?? await prisma.user.findFirst({
    where: { email: "vikram.desai@dealflow360.in" },
  }) ?? await prisma.user.findFirst({ where: { role: "APPROVER" } });

  const financeDirector = await prisma.user.findFirst({
    where: { email: "meera.joshi@dealflow360.in" },
  }) ?? await prisma.user.findFirst({ where: { role: "APPROVER" } });

  const execVp = await prisma.user.findFirst({
    where: { email: "rajiv.menon@dealflow360.in" },
  }) ?? await prisma.user.findFirst({ where: { role: "ADMIN" } });

  const risk = quote.riskScore ?? 50;
  const isHighRisk = risk >= 70;
  const priority = isHighRisk ? ApprovalPriority.HIGH : ApprovalPriority.MEDIUM;

  // Create approval record
  const approval = await prisma.approval.create({
    data: {
      quotationId,
      status: ApprovalStatus.PENDING,
      priority,
      currentStep: 1,
      requestedById: quote.ownerId,
      assignedToId: salesManager?.id ?? quote.ownerId,
      workflowSteps: {
        create: [
          {
            stepOrder: 1,
            role: "Sales Management",
            status: WorkflowStepStatus.IN_PROGRESS,
            approverId: salesManager?.id,
            notes: "Stage 1: Commercial viability & rep discount allowance",
          },
          {
            stepOrder: 2,
            role: "Commercial Finance",
            status: WorkflowStepStatus.PENDING,
            approverId: financeDirector?.id,
            notes: "Stage 2: Margin threshold & payment terms governance",
          },
          ...(isHighRisk
            ? [
                {
                  stepOrder: 3,
                  role: "Executive Board",
                  status: WorkflowStepStatus.PENDING,
                  approverId: execVp?.id,
                  notes: "Stage 3: Executive sign-off for high-risk commercial deal",
                },
              ]
            : []),
        ],
      },
    },
    include: {
      workflowSteps: {
        include: { approver: true },
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  // Update quote status
  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Sales Review",
    },
  });

  // Record history
  await prisma.approvalHistory.create({
    data: {
      approvalId: approval.id,
      actorId: quote.ownerId,
      eventType: "SUBMITTED",
      message: notes || "Submitted for commercial governance review",
    },
  });

  return approval;
}

export async function approveWorkflowStep(
  approvalId: string,
  comments?: string,
  actorId?: string
) {
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      quotation: true,
      workflowSteps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  if (!approval) throw new Error(`Approval ${approvalId} not found`);

  const currentStep = approval.workflowSteps.find(
    (s) => s.stepOrder === approval.currentStep
  );

  if (!currentStep) throw new Error(`Current workflow step ${approval.currentStep} not found`);

  // Update current step to APPROVED
  await prisma.approvalWorkflowStep.update({
    where: { id: currentStep.id },
    data: {
      status: WorkflowStepStatus.APPROVED,
      notes: comments ? `${currentStep.notes || ""} — Approved: ${comments}` : currentStep.notes,
    },
  });

  const nextStep = approval.workflowSteps.find(
    (s) => s.stepOrder === approval.currentStep + 1
  );

  if (nextStep) {
    // Advance to next step
    await prisma.approvalWorkflowStep.update({
      where: { id: nextStep.id },
      data: { status: WorkflowStepStatus.IN_PROGRESS },
    });

    await prisma.approval.update({
      where: { id: approvalId },
      data: {
        currentStep: nextStep.stepOrder,
        assignedToId: nextStep.approverId,
      },
    });

    await prisma.quotation.update({
      where: { id: approval.quotationId },
      data: {
        currentStage: nextStep.role.includes("Finance")
          ? "Finance Review"
          : nextStep.role.includes("Executive")
          ? "Executive Review"
          : "In Review",
      },
    });

    await prisma.approvalHistory.create({
      data: {
        approvalId,
        actorId: actorId ?? currentStep.approverId ?? approval.requestedById,
        eventType: "STAGE_APPROVED",
        message: `Stage ${currentStep.stepOrder} (${currentStep.role}) approved. Advanced to ${nextStep.role}.`,
      },
    });
  } else {
    // Complete workflow!
    await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.APPROVED,
      },
    });

    await prisma.quotation.update({
      where: { id: approval.quotationId },
      data: {
        status: QuotationStatus.APPROVED,
        currentStage: "Closed / Approved",
      },
    });

    await prisma.approvalHistory.create({
      data: {
        approvalId,
        actorId: actorId ?? currentStep.approverId ?? approval.requestedById,
        eventType: "FINAL_APPROVED",
        message: comments || "All approval stages passed successfully.",
      },
    });
  }
}

export async function rejectWorkflow(
  approvalId: string,
  reason: string,
  actorId?: string
) {
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      workflowSteps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  if (!approval) throw new Error(`Approval ${approvalId} not found`);

  const currentStep = approval.workflowSteps.find(
    (s) => s.stepOrder === approval.currentStep
  );

  if (currentStep) {
    await prisma.approvalWorkflowStep.update({
      where: { id: currentStep.id },
      data: {
        status: WorkflowStepStatus.REJECTED,
        notes: `Rejected: ${reason}`,
      },
    });
  }

  await prisma.approval.update({
    where: { id: approvalId },
    data: { status: ApprovalStatus.REJECTED },
  });

  await prisma.quotation.update({
    where: { id: approval.quotationId },
    data: {
      status: QuotationStatus.REJECTED,
      currentStage: "Rejected",
    },
  });

  await prisma.approvalHistory.create({
    data: {
      approvalId,
      actorId: actorId ?? currentStep?.approverId ?? approval.requestedById,
      eventType: "REJECTED",
      message: reason,
    },
  });
}

export async function requestChangesWorkflow(
  approvalId: string,
  feedback: string,
  actorId?: string
) {
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) throw new Error(`Approval ${approvalId} not found`);

  await prisma.quotation.update({
    where: { id: approval.quotationId },
    data: {
      status: QuotationStatus.DRAFT,
      currentStage: "Changes Requested",
    },
  });

  await prisma.approvalHistory.create({
    data: {
      approvalId,
      actorId: actorId ?? approval.requestedById,
      eventType: "CHANGES_REQUESTED",
      message: feedback,
    },
  });
}

export async function getDatabaseApprovalItems() {
  const approvals = await prisma.approval.findMany({
    include: {
      quotation: {
        include: {
          customer: true,
          owner: true,
          lineItems: true,
        },
      },
      requestedBy: true,
      assignedTo: true,
      workflowSteps: {
        include: { approver: true },
        orderBy: { stepOrder: "asc" },
      },
      history: {
        include: { actor: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return approvals.map((appr) => {
    const q = appr.quotation;
    const totalVal = Number(q.totalValue);
    const subtotal = Number(q.subtotal);
    const discount = Number(q.discountTotal);
    const tax = Number(q.taxTotal);
    const margin = Number(q.estimatedMargin);
    const risk = q.riskScore ?? 0;

    const reasons = q.lineItems
      .filter((li) => li.discountLimitPercent && Number(li.discountPercent) > Number(li.discountLimitPercent))
      .map((li, idx) => ({
        id: `reason-${li.id}-${idx}`,
        title: `${li.productName || "Product"} Discount Exception`,
        requestedValue: `${Number(li.discountPercent)}%`,
        allowedLimit: `${Number(li.discountLimitPercent)}%`,
        exceptionText: `Requested discount exceeds standard authority threshold by ${(Number(li.discountPercent) - Number(li.discountLimitPercent)).toFixed(1)}%`,
        severity: (Number(li.discountPercent) > 20 ? "high" : "warning") as "high" | "warning",
      }));

    if (reasons.length === 0) {
      reasons.push({
        id: `reason-default-${appr.id}`,
        title: "Standard Governance Review",
        requestedValue: formatCurrency(totalVal, "INR"),
        allowedLimit: "₹50,00,000",
        exceptionText: "Standard commercial approval required for current account tier.",
        severity: "warning",
      });
    }

    const workflow = appr.workflowSteps.map((s) => ({
      stepNumber: s.stepOrder,
      role: s.role,
      assignee: s.approver?.name || s.role,
      status: (s.status === "APPROVED"
        ? "Completed"
        : s.status === "IN_PROGRESS"
        ? "Current"
        : "Pending") as "Completed" | "Current" | "Pending",
      statusLabel: s.status === "APPROVED" ? "Approved" : s.status === "IN_PROGRESS" ? "In Progress" : "Pending",
      delegatedLimitOrTrigger: s.notes || undefined,
    }));

    const history = appr.history.map((h) => ({
      id: h.id,
      time: h.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      description: h.message || h.eventType,
      actor: h.actor?.name || h.actor?.email?.split("@")[0] || "System",
    }));

    const statusMap: Record<string, "Awaiting Review" | "Pending" | "Approved" | "Rejected" | "Changes Requested"> = {
      PENDING: "Pending",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      ESCALATED: "Awaiting Review",
      CANCELLED: "Changes Requested",
    };

    return {
      id: appr.id,
      dealId: q.quotationNumber,
      customer: q.customer.name,
      customerGlobalId: q.customer.externalAccountId || undefined,
      value: formatCurrency(totalVal, "INR"),
      rawNumericValue: totalVal,
      riskScore: risk,
      riskCategory: (risk >= 70 ? "High" : risk >= 40 ? "Medium" : "Low") as "High" | "Medium" | "Low",
      currentStage: q.currentStage || "Review",
      submittedTimeAgo: "Active",
      submittedExactTime: appr.submittedAt.toLocaleDateString(),
      status: statusMap[appr.status] || "Pending",
      priority: (appr.priority === "HIGH" || appr.priority === "URGENT" ? "High" : appr.priority === "MEDIUM" ? "Medium" : "Low") as "High" | "Medium" | "Low",
      requestedBy: {
        name: appr.requestedBy.name || appr.requestedBy.email.split("@")[0],
        role: appr.requestedBy.role,
      },
      reasons,
      financials: {
        subtotal: formatCurrency(subtotal, "INR"),
        discount: `-${formatCurrency(discount, "INR")}`,
        estimatedTax: formatCurrency(tax, "INR"),
        netTotal: formatCurrency(totalVal, "INR"),
        estMargin: formatCurrency(Math.round(totalVal * (margin / 100)), "INR"),
        marginPercentage: `${margin.toFixed(0)}%`,
      },
      workflow,
      history,
      quoteUrl: `/quotations/${q.quotationNumber}`,
    };
  });
}

