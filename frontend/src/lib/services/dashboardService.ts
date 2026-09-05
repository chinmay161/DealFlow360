import { prisma } from "@/lib/prisma";
import { QuotationStatus, ApprovalStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/currency";

export async function getDashboardMetrics() {
  const [quotations, pendingApprovals, recentHistory] = await Promise.all([
    prisma.quotation.findMany({
      include: {
        customer: true,
        owner: true,
        lineItems: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.approval.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: {
        quotation: { include: { customer: true } },
        requestedBy: true,
        workflowSteps: {
          where: { status: "IN_PROGRESS" },
          include: { approver: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.approvalHistory.findMany({
      take: 8,
      include: {
        actor: true,
        approval: {
          include: { quotation: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let openPipeline = 0;
  let wonRevenue = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;

  const stageStats: Record<string, { count: number; value: number }> = {
    Qualification: { count: 0, value: 0 },
    Proposal: { count: 0, value: 0 },
    Negotiation: { count: 0, value: 0 },
    Approval: { count: 0, value: 0 },
    "Closed Won": { count: 0, value: 0 },
  };

  for (const q of quotations) {
    const val = Number(q.totalValue);
    const risk = q.riskScore ?? 0;

    if (q.status === QuotationStatus.DRAFT || q.status === QuotationStatus.IN_REVIEW) {
      openPipeline += val;
    } else if (q.status === QuotationStatus.APPROVED) {
      wonRevenue += val;
    }

    if (risk >= 70) highRiskCount++;
    else if (risk >= 40) mediumRiskCount++;
    else lowRiskCount++;

    const stage = q.currentStage || (q.status === QuotationStatus.APPROVED ? "Closed Won" : "Proposal");
    if (!stageStats[stage]) {
      stageStats[stage] = { count: 0, value: 0 };
    }
    stageStats[stage].count += 1;
    stageStats[stage].value += val;
  }

  return {
    kpi: {
      openPipeline,
      pendingApprovalsCount: pendingApprovals.length,
      dealsAtRiskCount: highRiskCount,
      wonRevenue,
      activeDealsCount: quotations.filter((q) => q.status !== QuotationStatus.REJECTED).length,
    },
    activeDeals: quotations.slice(0, 7).map((q) => {
      const risk = q.riskScore ?? 0;
      const riskLabel: "High" | "Medium" | "Low" =
        risk >= 70 ? "High" : risk >= 40 ? "Medium" : "Low";
      const statusType: "pending" | "active" | "awaiting" | "action" =
        q.status === "IN_REVIEW" ? "pending" : q.status === "APPROVED" ? "active" : "action";

      return {
        dealId: q.quotationNumber,
        customer: q.customer.name,
        value: formatCurrency(Number(q.totalValue), "INR"),
        riskScore: risk,
        riskLabel,
        stage: q.currentStage || "Drafting",
        status: q.status === "IN_REVIEW" ? "Pending Approval" : q.status === "APPROVED" ? "Approved" : "Active",
        statusType,
        href: `/quotations/${q.quotationNumber}`,
      };
    }),
    actionRequired: pendingApprovals.map((appr) => {
      const currentStep = appr.workflowSteps[0];
      return {
        id: appr.id,
        dealId: appr.quotation.quotationNumber,
        customer: appr.quotation.customer.name,
        role: currentStep?.role || "Manager Review",
        assignee: currentStep?.approver?.name || "Pending Assignee",
        timeAgo: "Needs attention",
        priority: appr.priority,
        href: `/approvals?id=${appr.id}`,
      };
    }),
    dealHealth: {
      lowRiskCount,
      mediumRiskCount,
      highRiskCount,
      totalCount: quotations.length,
    },
    pipelineStages: Object.entries(stageStats).map(([stage, stat]) => ({
      stage,
      count: stat.count,
      value: stat.value,
      displayValue: formatCurrency(stat.value, "INR"),
    })),
    recentActivity: recentHistory.map((hist) => ({
      id: hist.id,
      actorName: hist.actor?.name || hist.actor?.email?.split("@")[0] || "System",
      dealId: hist.approval.quotation.quotationNumber,
      action: hist.eventType.replace(/_/g, " "),
      notes: hist.message,
      timestamp: hist.createdAt.toISOString(),
    })),
  };
}
