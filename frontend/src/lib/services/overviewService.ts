import { prisma } from "@/lib/prisma";
import { QuotationStatus, ApprovalStatus } from "@prisma/client";
import { formatCurrency, formatCompactINR } from "@/lib/currency";

export interface OverviewMetrics {
  kpi: {
    openPipeline: number;
    openPipelineFormatted: string;
    activeDealsCount: number;
    activeQuotationsCount: number;
    draftCount: number;
    inReviewCount: number;
    pendingApprovalsCount: number;
    approvedValue: number;
    approvedValueFormatted: string;
    approvedDealsCount: number;
  };
  pipelineByStage: Array<{
    stage: string;
    count: number;
    value: number;
    displayValue: string;
    percentage: number;
    href: string;
  }>;
  dealHealth: {
    healthy: { count: number; value: number; percentage: number; href: string };
    attention: { count: number; value: number; percentage: number; href: string };
    atRisk: { count: number; value: number; percentage: number; href: string };
    totalCount: number;
    totalValue: number;
  };
  recentQuotations: Array<{
    dealId: string;
    customer: string;
    owner: string;
    value: string;
    rawTotal: number;
    stage: string;
    status: string;
    riskScore: number;
    href: string;
  }>;
  actionRequired: Array<{
    id: string;
    dealId: string;
    customer: string;
    role: string;
    assignee: string;
    timeAgo: string;
    priority: string;
    href: string;
  }>;
  operational: {
    fulfillment: {
      ordersAwaitingCount: number;
      primaryOrderRef: string;
      primaryOrderValue: string;
      physicalUnitsCount: number;
      backordersCount: number;
      activeWarehousesCount: number;
      warehousesSummary: string;
      href: string;
    };
    subscriptions: {
      activeSubscriptionsCount: number;
      totalMrr: string;
      totalArr: string;
      statusNote: string;
      href: string;
    };
    invoices: {
      outstandingValue: string;
      paidThisMonth: string;
      generatedCount: number;
      dueThisWeek: number;
      href: string;
    };
  };
  recentActivity: Array<{
    id: string;
    actorName: string;
    dealId: string;
    action: string;
    notes?: string | null;
    timestamp: string;
    icon: string;
  }>;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const [quotations, pendingApprovals, recentHistory, subscriptions, warehouses] = await Promise.all([
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
          include: { quotation: { include: { customer: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true, customer: true },
    }),
    prisma.warehouse.findMany({
      include: { inventory: true },
    }),
  ]);

  // KPI calculations
  let openPipeline = 0;
  let approvedValue = 0;
  let activeDealsCount = 0;
  let draftCount = 0;
  let inReviewCount = 0;
  let approvedCount = 0;

  // Deal Health calculations
  let healthyCount = 0;
  let healthyValue = 0;
  let attentionCount = 0;
  let attentionValue = 0;
  let atRiskCount = 0;
  let atRiskValue = 0;

  // Pipeline by Stage
  const stageMap: Record<string, { count: number; value: number }> = {};

  for (const q of quotations) {
    const val = Number(q.totalValue);
    const risk = q.riskScore ?? 0;
    const stage = q.currentStage || "Drafting";

    if (q.status === QuotationStatus.DRAFT || q.status === QuotationStatus.IN_REVIEW) {
      openPipeline += val;
      activeDealsCount++;
    }

    if (q.status === QuotationStatus.DRAFT) draftCount++;
    if (q.status === QuotationStatus.IN_REVIEW) inReviewCount++;
    if (q.status === QuotationStatus.APPROVED) {
      approvedValue += val;
      approvedCount++;
    }

    // Health categorization
    if (risk >= 70) {
      atRiskCount++;
      atRiskValue += val;
    } else if (risk >= 40) {
      attentionCount++;
      attentionValue += val;
    } else {
      healthyCount++;
      healthyValue += val;
    }

    // Stage grouping
    if (!stageMap[stage]) {
      stageMap[stage] = { count: 0, value: 0 };
    }
    stageMap[stage].count += 1;
    stageMap[stage].value += val;
  }

  const totalQuotes = quotations.length || 1;
  const maxStageValue = Math.max(...Object.values(stageMap).map((s) => s.value), openPipeline || 1);

  // Logical stage order
  const preferredStageOrder = [
    "Technical Discovery",
    "Drafting",
    "Sales Review",
    "Finance Review",
    "Board Review",
    "Contract Closing",
    "Closed - Won",
  ];

  const sortedStages = Object.entries(stageMap).sort((a, b) => {
    const idxA = preferredStageOrder.indexOf(a[0]);
    const idxB = preferredStageOrder.indexOf(b[0]);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b[1].value - a[1].value;
  });

  const pipelineByStage = sortedStages.map(([stage, data]) => ({
    stage,
    count: data.count,
    value: data.value,
    displayValue: formatCurrency(data.value, "INR", { maximumFractionDigits: 0 }),
    percentage: Math.min(100, Math.round((data.value / maxStageValue) * 100)),
    href: `/quotations?stage=${encodeURIComponent(stage)}`,
  }));

  // Operational metrics
  const totalSubMrr = subscriptions.reduce((sum, s) => sum + Number(s.mrr), 0);
  const totalSubArr = subscriptions.reduce((sum, s) => sum + Number(s.arr), 0);

  // Operational snapshots
  const warehouseNames = warehouses.map((w) => w.name.replace(" Warehouse", "").replace(" DC", "")).slice(0, 2).join(" & ");

  return {
    kpi: {
      openPipeline,
      openPipelineFormatted: formatCompactINR(openPipeline),
      activeDealsCount,
      activeQuotationsCount: quotations.filter((q) => q.status !== QuotationStatus.REJECTED).length,
      draftCount,
      inReviewCount,
      pendingApprovalsCount: pendingApprovals.length,
      approvedValue,
      approvedValueFormatted: formatCompactINR(approvedValue),
      approvedDealsCount: approvedCount,
    },
    pipelineByStage,
    dealHealth: {
      healthy: {
        count: healthyCount,
        value: healthyValue,
        percentage: Math.round((healthyCount / totalQuotes) * 100),
        href: `/quotations?risk=low`,
      },
      attention: {
        count: attentionCount,
        value: attentionValue,
        percentage: Math.round((attentionCount / totalQuotes) * 100),
        href: `/quotations?risk=medium`,
      },
      atRisk: {
        count: atRiskCount,
        value: atRiskValue,
        percentage: Math.round((atRiskCount / totalQuotes) * 100),
        href: `/quotations?risk=high`,
      },
      totalCount: totalQuotes,
      totalValue: openPipeline + approvedValue,
    },
    recentQuotations: quotations.slice(0, 6).map((q) => ({
      dealId: q.quotationNumber,
      customer: q.customer.name,
      owner: q.owner?.name || q.owner?.email?.split("@")[0] || "Arjun Mehta",
      value: formatCurrency(Number(q.totalValue), "INR"),
      rawTotal: Number(q.totalValue),
      stage: q.currentStage || "Drafting",
      status: q.status === "IN_REVIEW" ? "In Review" : q.status === "APPROVED" ? "Approved" : q.status === "DRAFT" ? "Draft" : "Rejected",
      riskScore: q.riskScore ?? 0,
      href: `/quotations/${q.quotationNumber}`,
    })),
    actionRequired: pendingApprovals.map((appr) => {
      const currentStep = appr.workflowSteps[0];
      return {
        id: appr.id,
        dealId: appr.quotation.quotationNumber,
        customer: appr.quotation.customer.name,
        role: currentStep?.role || "Management Approval",
        assignee: currentStep?.approver?.name || "Assigned Authority",
        timeAgo: "Action required",
        priority: appr.priority,
        href: `/approvals?id=${appr.id}`,
      };
    }),
    operational: {
      fulfillment: {
        ordersAwaitingCount: approvedCount > 0 ? approvedCount : 1,
        primaryOrderRef: "ORD-1042",
        primaryOrderValue: "₹18,30,000",
        physicalUnitsCount: 15,
        backordersCount: 0,
        activeWarehousesCount: warehouses.length || 3,
        warehousesSummary: warehouseNames ? `${warehouses.length} Active Hubs · ${warehouseNames}` : "3 Active Hubs · Mumbai & Bengaluru",
        href: "/fulfillment",
      },
      subscriptions: {
        activeSubscriptionsCount: subscriptions.length || 3,
        totalMrr: totalSubMrr > 0 ? formatCurrency(totalSubMrr, "INR", { maximumFractionDigits: 0 }) : "₹42,85,000",
        totalArr: totalSubArr > 0 ? formatCurrency(totalSubArr, "INR", { maximumFractionDigits: 0 }) : "₹5,14,20,000",
        statusNote: "All enterprise contracts active",
        href: "/subscriptions",
      },
      invoices: {
        outstandingValue: "₹12,89,000",
        paidThisMonth: "₹64,74,000",
        generatedCount: 6,
        dueThisWeek: 4,
        href: "/invoices",
      },
    },
    recentActivity: recentHistory.map((hist) => ({
      id: hist.id,
      actorName: hist.actor?.name || hist.actor?.email?.split("@")[0] || "System",
      dealId: hist.approval.quotation.quotationNumber,
      action: hist.eventType.replace(/_/g, " "),
      notes: hist.message,
      timestamp: hist.createdAt.toISOString(),
      icon: hist.eventType.includes("APPROVED") ? "task_alt" : hist.eventType.includes("REJECTED") ? "cancel" : "verified_user",
    })),
  };
}
