"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Shield,
  Bell,
  LogOut,
  Mail,
  Building,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function ManagerProfilePage() {
  const { user, initials, roleDisplay } = useCurrentUser();
  const { success } = useToast();

  const [instantAlerts, setInstantAlerts] = useState(true);
  const [highRiskSms, setHighRiskSms] = useState(false);
  const [autoDelegation, setAutoDelegation] = useState(false);

  const userName = user?.name || "Commercial Manager";
  const userEmail = user?.email || "";
  const displayRole = user?.title || user?.roleDisplay || roleDisplay;

  const handleSavePreferences = () => {
    success("Preferences Saved", "Manager notification and SLA triggers updated.");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div>
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
          Manager Profile & Governance Authority
        </h1>
        <p className="font-body-sm text-body-sm text-outline mt-0.5">
          Manage your operational credentials, commercial delegation limits, and notification preferences.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-md border-2 border-slate-100">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-on-surface">{userName}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {displayRole}
              </span>
            </div>
            <p className="text-xs text-outline mt-0.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{userEmail}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span>{user?.department || "Commercial Management"} • {user?.territory || "Western & Northern India Enterprise"}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="h-9 px-4 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Commercial Authority Scope */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-title-md text-sm font-bold text-on-surface">
            Commercial Delegation Authority (Level 1)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Max Discount Approval</span>
            <p className="text-base font-bold text-on-surface">Up to 25.0%</p>
            <span className="text-[11px] text-slate-400">Above 25% requires Director sign-off</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Single Deal Authorization</span>
            <p className="text-base font-bold text-on-surface">Up to ₹50,00,000</p>
            <span className="text-[11px] text-slate-400">Deals &gt; ₹50L routed to Finance (L2)</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Risk Threshold Ceiling</span>
            <p className="text-base font-bold text-primary">Score &lt; 75 / 100</p>
            <span className="text-[11px] text-slate-400">High-risk flags require multi-signoff</span>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-title-md text-sm font-bold text-on-surface">
            Governance & Alert Preferences
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <p className="font-semibold text-on-surface">Instant Email Alerts for New Approvals</p>
              <p className="text-slate-500 text-[11px]">
                Receive immediate notification when a sales representative submits a quote requiring review.
              </p>
            </div>
            <input
              type="checkbox"
              checked={instantAlerts}
              onChange={(e) => setInstantAlerts(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <p className="font-semibold text-on-surface">Escalation for High-Risk Submissions</p>
              <p className="text-slate-500 text-[11px]">
                Notify immediately when deals with Risk Score &gt;= 70 enter the approval queue.
              </p>
            </div>
            <input
              type="checkbox"
              checked={highRiskSms}
              onChange={(e) => setHighRiskSms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <p className="font-semibold text-on-surface">Auto-Delegation During Out-of-Office</p>
              <p className="text-slate-500 text-[11px]">
                Automatically route pending items to secondary commercial manager if unattended for 24 hours.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoDelegation}
              onChange={(e) => setAutoDelegation(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
          </label>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="h-8 px-4 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary text-xs font-semibold transition-colors shadow-xs"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
