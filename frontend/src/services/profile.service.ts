import { apiClient } from "./api-client";
import type { UserProfile, ChangePasswordInput } from "@/types/user.types";

export const profileService = {
  /**
   * Fetch current user profile and preferences
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient<UserProfile>("/api/profile");
  },

  /**
   * Update preferences
   */
  async updatePreferences(preferences: Partial<UserProfile["preferences"]>): Promise<UserProfile> {
    return apiClient<UserProfile>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ preferences }),
    });
  },

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordInput): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>("/api/profile/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
