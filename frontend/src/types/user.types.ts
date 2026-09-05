export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  department?: string;
  territory?: string;
  preferences: {
    currency: "INR" | "USD" | "EUR";
    emailAlerts: boolean;
    approvalUpdates: boolean;
    compactView: boolean;
  };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
