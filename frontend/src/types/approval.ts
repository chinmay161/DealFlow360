export type ApprovalPriority = "High" | "Medium" | "Low";
export type ApprovalStatus = "Awaiting Review" | "Pending" | "Approved" | "Rejected" | "Changes Requested";
export type WorkflowStepStatus = "Completed" | "Current" | "Pending";

export interface ApprovalReason {
  id: string;
  title: string;
  requestedValue: string;
  allowedLimit: string;
  exceptionText: string;
  severity: "high" | "warning";
}

export interface FinancialOverview {
  subtotal: string;
  discount: string;
  estimatedTax: string;
  netTotal: string;
  estMargin: string;
  marginPercentage: string;
}

export interface WorkflowStep {
  stepNumber: number;
  role: string;
  assignee: string;
  status: WorkflowStepStatus;
  statusLabel: string;
  delegatedLimitOrTrigger?: string;
}

export interface HistoryEvent {
  id: string;
  time: string;
  description: string;
  actor?: string;
}

export interface ApprovalItem {
  id: string;
  dealId: string;
  customer: string;
  customerGlobalId?: string;
  value: string;
  rawNumericValue: number;
  riskScore: number;
  riskCategory: "High" | "Medium" | "Low";
  currentStage: string;
  submittedTimeAgo: string;
  submittedExactTime?: string;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  requestedBy: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  reasons: ApprovalReason[];
  financials: FinancialOverview;
  workflow: WorkflowStep[];
  history: HistoryEvent[];
  quoteUrl?: string;
}

export interface ApprovalQueueFilter {
  tab: "my_queue" | "team_queue" | "history";
  searchQuery: string;
  priorityFilter: string;
  statusFilter: string;
  sortBy: string;
}
