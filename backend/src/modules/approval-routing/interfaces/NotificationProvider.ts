/**
 * Approval Routing — Notification Provider Contract
 *
 * Defines the abstract interface for sending notifications on approval events.
 * Implementation can be mocked or swapped for real notification channels.
 */

export interface ApprovalAssignedParams {
  quotationId: string;
  approvalId: string;
  approverId: string;
  stage: number;
  stageName: string;
}

export interface ApprovalCompletedParams {
  quotationId: string;
  quoteNumber?: string;
  totalStages: number;
}

export interface ApprovalRejectedParams {
  quotationId: string;
  approvalId?: string;
  quoteNumber?: string;
  rejectedBy: string;
  comments: string;
}

export interface NotificationProvider {
  notifyApprovalAssigned(params: ApprovalAssignedParams): Promise<void>;
  notifyApprovalCompleted(params: ApprovalCompletedParams): Promise<void>;
  notifyApprovalRejected(params: ApprovalRejectedParams): Promise<void>;
}

/**
 * In-memory Mock Notification Provider for development and tests.
 */
export class MockNotificationProvider implements NotificationProvider {
  public assignedEvents: ApprovalAssignedParams[] = [];
  public completedEvents: ApprovalCompletedParams[] = [];
  public rejectedEvents: ApprovalRejectedParams[] = [];

  async notifyApprovalAssigned(params: ApprovalAssignedParams): Promise<void> {
    this.assignedEvents.push(params);
  }

  async notifyApprovalCompleted(params: ApprovalCompletedParams): Promise<void> {
    this.completedEvents.push(params);
  }

  async notifyApprovalRejected(params: ApprovalRejectedParams): Promise<void> {
    this.rejectedEvents.push(params);
  }

  clear(): void {
    this.assignedEvents = [];
    this.completedEvents = [];
    this.rejectedEvents = [];
  }
}
