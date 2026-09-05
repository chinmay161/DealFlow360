import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@/types/user.types";

interface UserProfileCardProps {
  profile: UserProfile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center gap-2">
        <User className="h-4 w-4 text-blue-600" />
        <CardTitle className="text-sm font-semibold">User Identification</CardTitle>
      </CardHeader>

      <CardContent className="pt-5 space-y-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
            {profile.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">
              {profile.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary" className="text-[10px] py-0">
                {profile.role}
              </Badge>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{profile.department || "Commercial Sales"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
              {profile.email}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Commercial Territory
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
              {profile.territory || "Enterprise Commercial Region"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
