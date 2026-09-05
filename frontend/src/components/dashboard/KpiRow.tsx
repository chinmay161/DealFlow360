"use client";

import React from "react";

export const KpiRow: React.FC = () => {
  return (
    <div className="grid grid-cols-4 gap-space-base">
      {/* KPI 1: Open Pipeline */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Open Pipeline
          </span>
          <span className="material-symbols-outlined text-outline text-base" data-icon="account_balance_wallet">
            account_balance_wallet
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            $1.28M
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <span className="material-symbols-outlined text-[11px]" data-icon="trending_up">trending_up</span>
            +12.4%
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>vs last month</span>
          <span className="font-medium text-on-surface">24 active deals</span>
        </div>
      </div>

      {/* KPI 2: Pending Approvals */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Pending Approvals
          </span>
          <span className="material-symbols-outlined text-[#D97706] text-base" data-icon="pending_actions">
            pending_actions
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            12
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            3 high priority
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Requires review</span>
          <span className="font-medium text-[#92400E]">Action required</span>
        </div>
      </div>

      {/* KPI 3: Deals At Risk */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Deals At Risk
          </span>
          <span className="material-symbols-outlined text-[#E11D48] text-base" data-icon="warning">
            warning
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-[#9F1239] tnum">
            4
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]"></span>
            Critical
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Immediate attention</span>
          <span className="font-medium text-[#9F1239]">Margin &amp; SLA risk</span>
        </div>
      </div>

      {/* KPI 4: Monthly Revenue */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Monthly Revenue
          </span>
          <span className="material-symbols-outlined text-primary text-base" data-icon="payments">
            payments
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-primary tnum">
            $324K
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <span className="material-symbols-outlined text-[11px]" data-icon="trending_up">trending_up</span>
            +8.7%
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Progress</span>
          <span className="font-medium text-on-surface">68% of monthly target</span>
        </div>
      </div>
    </div>
  );
};
