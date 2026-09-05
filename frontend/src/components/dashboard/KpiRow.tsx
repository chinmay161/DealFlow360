"use client";

import React from "react";
import Link from "next/link";
import { formatCompactINR } from "@/lib/currency";

interface KpiRowProps {
  kpi?: {
    openPipeline: number;
    pendingApprovalsCount: number;
    dealsAtRiskCount: number;
    wonRevenue: number;
    activeDealsCount: number;
  };
}

export const KpiRow: React.FC<KpiRowProps> = ({ kpi }) => {
  const openPipelineStr = kpi
    ? formatCompactINR(kpi.openPipeline)
    : "₹1.28 Cr";
  const pendingApprovals = kpi ? kpi.pendingApprovalsCount : 12;
  const dealsAtRisk = kpi ? kpi.dealsAtRiskCount : 4;
  const activeDeals = kpi ? kpi.activeDealsCount : 24;
  const wonRevenueStr = kpi ? formatCompactINR(kpi.wonRevenue) : "₹48.0L";

  return (
    <div className="grid grid-cols-4 gap-space-base">
      {/* KPI 1: Open Pipeline */}
      <Link
        href="/quotations?view=list"
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-primary/50 transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider group-hover:text-primary transition-colors">
            Open Pipeline
          </span>
          <span className="material-symbols-outlined text-outline text-base group-hover:text-primary transition-colors" data-icon="account_balance_wallet">
            account_balance_wallet
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            {openPipelineStr}
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <span className="material-symbols-outlined text-[11px]" data-icon="trending_up">trending_up</span>
            +12.4%
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Active Pipeline</span>
          <span className="font-medium text-on-surface">{activeDeals} active deals</span>
        </div>
      </Link>

      {/* KPI 2: Pending Approvals */}
      <Link
        href="/approvals"
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-[#D97706]/50 transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider group-hover:text-[#D97706] transition-colors">
            Pending Approvals
          </span>
          <span className="material-symbols-outlined text-[#D97706] text-base" data-icon="pending_actions">
            pending_actions
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            {pendingApprovals}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            Active Queue
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Requires review</span>
          <span className="font-medium text-[#92400E]">Action required</span>
        </div>
      </Link>

      {/* KPI 3: Deals At Risk */}
      <Link
        href="/quotations?view=list"
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-[#E11D48]/50 transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider group-hover:text-[#E11D48] transition-colors">
            Deals At Risk
          </span>
          <span className="material-symbols-outlined text-[#E11D48] text-base" data-icon="warning">
            warning
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-[#9F1239] tnum">
            {dealsAtRisk}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]"></span>
            Score &ge; 70
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Governance tier</span>
          <span className="font-medium text-[#9F1239]">Exception flags</span>
        </div>
      </Link>

      {/* KPI 4: Approved Value */}
      <Link
        href="/quotations?view=list"
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-[#059669]/50 transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider group-hover:text-[#059669] transition-colors">
            Approved Deals
          </span>
          <span className="material-symbols-outlined text-[#059669] text-base" data-icon="verified">
            verified
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-[#065F46] tnum">
            {wonRevenueStr}
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <span className="material-symbols-outlined text-[11px]" data-icon="task_alt">task_alt</span>
            Cleared
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Commercial stage</span>
          <span className="font-medium text-[#065F46]">Ready to fulfill</span>
        </div>
      </Link>
    </div>
  );
};
