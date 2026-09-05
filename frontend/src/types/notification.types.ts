export type NotificationCategory =
  | "QUOTATION_APPROVED"
  | "QUOTATION_RETURNED"
  | "QUOTATION_REJECTED"
  | "MANAGER_COMMENT"
  | "APPROVAL_REQUESTED"
  | "SYSTEM";

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  quotationId?: string;
  quotationNumber?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}
