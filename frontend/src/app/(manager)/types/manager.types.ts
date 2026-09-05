/**
 * Manager Dashboard Domain Types
 */

export type RiskLevel = "Low" | "Medium" | "High";

export type WorkflowStage =
  | "Sales Management"
  | "Commercial Finance"
  | "Executive Board"
  | "Manager Review"
  | "Finance Review"
  | "Executive Review"
  | "Completed";

export type ManagerApprovalStatus =
  | "Pending"
  | "In Review"
  | "Approved"
  | "Rejected"
  | "Changes Requested";

export interface ApprovalItem {
  id: string;
  dealId: string;
  quotationNumber: string;
  customer: string;
  customerTier: string;
  customerGlobalId?: string;
  salesExecutive: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  amount: number;
  formattedAmount: string;
  riskScore: number;
  riskCategory: RiskLevel;
  approvalLevel: string;
  currentStage: string;
  submittedAt: string;
  submittedTimeAgo: string;
  status: ManagerApprovalStatus;
  priority: "High" | "Medium" | "Low";
  reasons: {
    id: string;
    title: string;
    requestedValue: string;
    allowedLimit: string;
    exceptionText: string;
    severity: "high" | "warning";
  }[];
  financials: {
    subtotal: string;
    discount: string;
    estimatedTax: string;
    netTotal: string;
    estMargin: string;
    marginPercentage: string;
  };
  workflow: {
    stepNumber: number;
    role: string;
    assignee: string;
    status: "Completed" | "Current" | "Pending";
    statusLabel: string;
    delegatedLimitOrTrigger?: string;
    completedAt?: string;
    notes?: string;
  }[];
  history: {
    id: string;
    time: string;
    description: string;
    actor: string;
  }[];
  lineItemsCount: number;
  quoteUrl: string;
}

export interface ManagerDashboardKPIs {
  pendingApprovals: number;
  quotesReviewedToday: number;
  highRiskQuotations: number;
  totalApprovalValue: number;
  formattedTotalValue: string;
  averageApprovalTimeHours: number;
  autoApprovalRate: number;
  pendingApprovalsUrgent: number;
  growthPercent: number;
}

export interface ApprovalTrendData {
  period: string;
  approved: number;
  rejected: number;
  pending: number;
  totalValue: number;
}

export interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface RiskDistributionData {
  bracket: string;
  count: number;
  revenue: number;
  color: string;
}

export interface MonthlyRevenueData {
  month: string;
  awaitingApproval: number;
  approvedRevenue: number;
  rejectedRevenue: number;
}

export interface RuleFailureData {
  ruleName: string;
  failures: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
}

export interface ManagerDashboardData {
  kpi: ManagerDashboardKPIs;
  approvalTrend: ApprovalTrendData[];
  statusDistribution: StatusDistributionData[];
  riskDistribution: RiskDistributionData[];
  monthlyRevenue: MonthlyRevenueData[];
  ruleFailures: RuleFailureData[];
  recentPendingQueue: ApprovalItem[];
}

export interface ManagerAnalyticsData {
  approvalRate: number;
  averageRisk: number;
  autoApprovalRate: number;
  totalApprovedRevenue: number;
  totalRejectedRevenue: number;
  monthlyApprovals: {
    month: string;
    approved: number;
    rejected: number;
    avgTimeHours: number;
  }[];
  approvalTimeTrend: {
    week: string;
    hours: number;
    slaTarget: number;
  }[];
  topFailedRules: {
    rule: string;
    count: number;
    impactAmount: number;
  }[];
  revenueByStatus: {
    status: string;
    amount: number;
    color: string;
  }[];
  approvalDistribution: {
    department: string;
    percentage: number;
    count: number;
  }[];
  riskScoreDistribution: {
    range: string;
    count: number;
  }[];
}

export interface AuditRecordItem {
  id: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
  entity: string;
  entityId: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PaginatedAuditResponse {
  items: AuditRecordItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LineItemDetail {
  id: string;
  sku: string;
  productName: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  marginPercent: number;
  totalAmount: number;
}

export interface QuotationReviewDetails {
  id: string;
  quotationNumber: string;
  status: string;
  currentStage: string;
  riskScore: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    customerNumber?: string;
    tier: string;
    industry?: string;
    creditLimit: number;
    creditAvailable: number;
    paymentTerms: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  financials: {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    estimatedMargin: number;
    marginAmount: number;
    totalValue: number;
  };
  lineItems: LineItemDetail[];
  ruleResults: {
    overallDecision: string;
    approvalLevel: string;
    riskScore: number;
    rulesPassed: number;
    rulesFailed: number;
    rulesWarning: number;
    recommendations: string[];
    evaluatedAt: string;
  };
  decisionTrace: {
    ruleId: string;
    ruleName: string;
    outcome: "PASS" | "WARN" | "FAIL";
    severity: string;
    computedValue: any;
    threshold: any;
    explanation: string;
    evaluatedAt: string;
    inputs: Record<string, any>;
    recommendation?: string | null;
  }[];
  counterfactuals: {
    id: string;
    title: string;
    description: string;
    changes: {
      lineItemId?: string;
      productName?: string;
      field: string;
      currentValue: any;
      proposedValue: any;
      displayChange: string;
    }[];
    expectedResult: string;
    revenueImpact: number;
    revenueImpactFormatted: string;
    projectedRiskScore: number;
    currentRiskScore: number;
    feasibilityScore: number;
  }[];
  approvalHistory: {
    stage: number;
    role: string;
    approverName: string;
    status: "APPROVED" | "PENDING" | "REJECTED" | "SKIPPED";
    decidedAt?: string | null;
    comments?: string | null;
  }[];
  auditTimeline: {
    id: string;
    time: string;
    title: string;
    description: string;
    actor: string;
    role: string;
    type: string;
  }[];
}
