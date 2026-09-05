export interface ApprovalStepDetail {
  id: string;
  stage: number;
  stepName: string;
  approverRole: string;
  approverName?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RETURNED" | "SKIPPED";
  decidedAt?: string | null;
  comments?: string | null;
}

export interface QuotationWorkflowStatus {
  quotationId: string;
  currentStage: string;
  status: string;
  steps: ApprovalStepDetail[];
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
}

export interface TransitionPayload {
  targetState: string;
  actorId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface TransitionHistoryEntry {
  id: string;
  fromState: string;
  toState: string;
  actorName: string;
  actorRole: string;
  reason?: string | null;
  createdAt: string;
}
