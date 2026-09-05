"use client";

import React, { useEffect, useState } from "react";
import { UserProfileCard } from "@/features/profile/UserProfileCard";
import { SecuritySettings } from "@/features/profile/SecuritySettings";
import { PreferencesCard } from "@/features/profile/PreferencesCard";
import { profileService } from "@/services/profile.service";
import type { UserProfile } from "@/types/user.types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    profileService
      .getProfile()
      .then(setProfile)
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          User Profile & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your commercial sales identity, authentication credentials, and notifications.
        </p>
      </div>

      {isLoading || !profile ? (
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <UserProfileCard profile={profile} />
          <PreferencesCard preferences={profile.preferences} />
          <SecuritySettings />
        </div>
      )}
    </div>
  );
}
