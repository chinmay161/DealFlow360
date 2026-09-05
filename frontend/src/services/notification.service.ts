import { apiClient } from "./api-client";
import type { NotificationsResponse } from "@/types/notification.types";

export const notificationService = {
  /**
   * Fetch all notifications with unread count
   */
  async getNotifications(): Promise<NotificationsResponse> {
    return apiClient<NotificationsResponse>("/api/notifications");
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "POST",
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>("/api/notifications/mark-all-read", {
      method: "POST",
    });
  },
};
