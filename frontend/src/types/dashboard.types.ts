export interface DashboardKpis {
  activeQuotations: number;
  pendingApproval: number;
  approvedQuotations: number;
  rejectedQuotations: number;
  monthlyRevenue: number;
  revenueGrowthPercent: number;
  averageApprovalTimeHours: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  color: string;
}

export interface MonthlyQuotationData {
  month: string;
  total: number;
  approved: number;
  pending: number;
}

export interface RevenueTrendData {
  date: string;
  grossValue: number;
  approvedValue: number;
}

export interface ActivityTimelineItem {
  id: string;
  quotationId: string;
  quotationNumber: string;
  eventType: "CREATED" | "EVALUATED" | "APPROVAL_STARTED" | "APPROVED" | "REJECTED" | "RETURNED";
  title: string;
  description: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  badgeColor?: "blue" | "green" | "yellow" | "red" | "purple";
}

export interface DashboardMetricsResponse {
  kpi: DashboardKpis;
  statusDistribution: StatusDistributionItem[];
  monthlyQuotations: MonthlyQuotationData[];
  revenueTrend: RevenueTrendData[];
  recentActivity: ActivityTimelineItem[];
}
