"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { profileService } from "@/services/profile.service";
import { useToast } from "@/components/providers/ToastProvider";

export function SecuritySettings() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Validation error", "All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Validation error", "New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Validation error", "Password must be at least 8 characters");
      return;
    }

    try {
      setIsLoading(true);
      await profileService.changePassword({ currentPassword, newPassword, confirmPassword });
      toast.success("Password changed", "Your security credentials have been updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("Password update failed", err?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center gap-2">
        <Lock className="h-4 w-4 text-blue-600" />
        <CardTitle className="text-sm font-semibold">Security & Access Credentials</CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Current Password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="h-9 text-xs"
            />
          </div>

          <Button type="submit" variant="primary" size="sm" isLoading={isLoading} className="text-xs h-9">
            Update Security Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
