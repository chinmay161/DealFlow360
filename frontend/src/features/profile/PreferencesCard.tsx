"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profileService } from "@/services/profile.service";
import { useToast } from "@/components/providers/ToastProvider";
import type { UserProfile } from "@/types/user.types";

interface PreferencesCardProps {
  preferences: UserProfile["preferences"];
}

export function PreferencesCard({ preferences: initialPreferences }: PreferencesCardProps) {
  const toast = useToast();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await profileService.updatePreferences(preferences);
      toast.success("Preferences updated", "Your workspace settings have been persisted.");
    } catch {
      toast.error("Update failed", "Unable to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center gap-2">
        <Sliders className="h-4 w-4 text-blue-600" />
        <CardTitle className="text-sm font-semibold">Workspace & Currency Preferences</CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-xs">
        {/* Currency selection */}
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Display Currency Formatting
          </label>
          <select
            value={preferences.currency}
            onChange={(e) =>
              setPreferences({ ...preferences, currency: e.target.value as any })
            }
            className="w-full max-w-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="INR">₹ Indian Rupee (INR)</option>
            <option value="USD">$ US Dollar (USD)</option>
            <option value="EUR">€ Euro (EUR)</option>
          </select>
        </div>

        {/* Notification toggles */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailAlerts}
              onChange={(e) =>
                setPreferences({ ...preferences, emailAlerts: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Email Notifications for Quotation Approvals
              </div>
              <div className="text-slate-500 text-[11px]">
                Receive instant emails when your quotation is approved, rejected, or returned.
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.approvalUpdates}
              onChange={(e) =>
                setPreferences({ ...preferences, approvalUpdates: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Manager Comments & Revision Requests
              </div>
              <div className="text-slate-500 text-[11px]">
                Get notified when approvers leave feedback on concession thresholds.
              </div>
            </div>
          </label>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            className="text-xs h-9"
          >
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
