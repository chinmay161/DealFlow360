"use client";

import React from "react";
import Link from "next/link";
import { OverviewMetrics } from "@/lib/services/overviewService";

interface OverviewKpiRowProps {
  kpi: OverviewMetrics["kpi"];
}

export const OverviewKpiRow: React.FC<OverviewKpiRowProps> = ({ kpi }) => {
  return (
    <div className="grid grid-cols-4 gap-space-base">
      {/* KPI 1: Total Pipeline */}
      <Link
        href="/quotations"
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-primary/50 transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider group-hover:text-primary transition-colors">
            Total Pipeline
          </span>
          <span
            className="material-symbols-outlined text-outline text-base group-hover:text-primary transition-colors"
            data-icon="account_balance_wallet"
          >
            account_balance_wallet
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            {kpi.openPipelineFormatted}
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <span className="material-symbols-outlined text-[11px]" data-icon="trending_up">
              trending_up
            </span>
            Active
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Commercial pipeline</span>
          <span className="font-medium text-on-surface">{kpi.activeDealsCount} active deals</span>
        </div>
      </Link>

      {/* KPI 2: Active Quotations */}
      <Link
        href="/quotations"
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-primary/50 transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider group-hover:text-primary transition-colors">
            Active Quotations
          </span>
          <span
            className="material-symbols-outlined text-outline text-base group-hover:text-primary transition-colors"
            data-icon="request_quote"
          >
            request_quote
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            {kpi.activeQuotationsCount}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Directory
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Status breakdown</span>
          <span className="font-medium text-on-surface">
            {kpi.draftCount} Draft · {kpi.inReviewCount} In Review
          </span>
        </div>
      </Link>

      {/* KPI 3: Pending Approvals */}
      <Link
        href="/approvals"
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-[#D97706]/50 transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider group-hover:text-[#D97706] transition-colors">
            Pending Approvals
          </span>
          <span
            className="material-symbols-outlined text-[#D97706] text-base"
            data-icon="pending_actions"
          >
            pending_actions
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            {kpi.pendingApprovalsCount}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            Requires Review
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Governance queue</span>
          <span className="font-medium text-[#92400E]">Action required</span>
        </div>
      </Link>

      {/* KPI 4: Approved Value */}
      <Link
        href="/fulfillment"
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-[#059669]/50 transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider group-hover:text-[#059669] transition-colors">
            Approved Value
          </span>
          <span
            className="material-symbols-outlined text-[#059669] text-base"
            data-icon="verified"
          >
            verified
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-[#065F46] tnum">
            {kpi.approvedValueFormatted}
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <span className="material-symbols-outlined text-[11px]" data-icon="task_alt">
              task_alt
            </span>
            Cleared
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Commercial stage</span>
          <span className="font-medium text-[#065F46]">
            Ready to fulfill · {kpi.approvedDealsCount} {kpi.approvedDealsCount === 1 ? "Deal" : "Deals"}
          </span>
        </div>
      </Link>
    </div>
  );
};
