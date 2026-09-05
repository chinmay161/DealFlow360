"use client";

import React from "react";

export const DealIntelligenceRow: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-space-base pt-space-xs items-stretch">
      {/* COLUMN 1: Financial Summary */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" data-icon="payments">payments</span>
              <span className="font-title-md text-title-md font-semibold text-on-surface">Financial Summary</span>
            </div>
            <span className="text-[11px] font-label-sm text-outline">USD ($)</span>
          </div>
          <div className="space-y-2.5 font-body-sm text-body-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Subtotal List Value</span>
              <span className="font-code-tabular tnum text-on-surface font-medium">$20,250.00</span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span>Blended Discount</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">17.0%</span>
              </span>
              <span className="font-code-tabular tnum text-[#9F1239] font-medium">-$3,420.00</span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Estimated Tax (State &amp; Fed)</span>
              <span className="font-code-tabular tnum text-on-surface font-medium">$1,470.00</span>
            </div>
          </div>
        </div>
        <div className="pt-3 mt-3 border-t border-[#E5E7EB] space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">Net Total Value</span>
              <span className="font-metric-display text-metric-display font-bold text-primary tnum leading-tight">$18,300.00</span>
            </div>
            <div className="text-right">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">Est. Margin</span>
              <span className="font-title-md text-title-md font-bold text-[#065F46] tnum">$6,588.00</span>
              <span className="block text-[11px] font-label-sm text-outline">36% gross margin</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between font-label-sm text-[11px] text-outline">
            <span>Total Units</span>
            <span className="font-semibold text-on-surface">16 Units across 3 lines</span>
          </div>
        </div>
      </div>

      {/* COLUMN 2: Deal Risk & Compliance */}
      <div className="bg-white border border-[#FECDD3] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] bg-gradient-to-b from-white to-[#FFF5F5] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#FECDD3]/50">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#E11D48] text-sm" data-icon="policy">policy</span>
              <span className="font-title-md text-title-md font-semibold text-[#9F1239]">Deal Risk &amp; Compliance</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-label-sm font-bold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
              High Risk (72/100)
            </span>
          </div>
          {/* Horizontal Risk Score Meter */}
          <div className="mt-3">
            <div className="flex justify-between font-label-sm text-[10px] text-outline mb-1 font-semibold">
              <span>0 (Compliant)</span>
              <span>50</span>
              <span className="text-[#E11D48]">72 (Current)</span>
              <span>100 (Violation)</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex relative p-0.5">
              <div className="w-1/3 bg-[#10B981] h-full rounded-l-full"></div>
              <div className="w-1/3 bg-[#F59E0B] h-full"></div>
              <div className="w-1/3 bg-[#E11D48] h-full rounded-r-full"></div>
              <div className="absolute top-0 bottom-0 left-[72%] w-1 bg-black ring-2 ring-white rounded-full"></div>
            </div>
          </div>
          {/* Key Risk Alerts */}
          <div className="mt-3 space-y-2">
            <div className="p-2 rounded bg-white/90 border border-[#FECDD3] flex items-start gap-2">
              <span className="material-symbols-outlined text-[#D97706] text-xs shrink-0 mt-0.5" data-icon="warning">warning</span>
              <p className="font-body-sm text-[11px] text-on-surface leading-tight">
                <strong className="text-[#92400E]">Service Discount Anomaly:</strong> Service discount (18%) exceeds configured Gold category ceiling (10%) by 8%.
              </p>
            </div>
            <div className="p-2 rounded bg-white/90 border border-[#FECDD3] flex items-start gap-2">
              <span className="material-symbols-outlined text-[#E11D48] text-xs shrink-0 mt-0.5" data-icon="error">error</span>
              <p className="font-body-sm text-[11px] text-on-surface leading-tight">
                <strong className="text-[#9F1239]">Margin Below Target:</strong> Blended gross margin (36%) is 4% below company target threshold (40%).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 3: Approval Routing Chain */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" data-icon="account_tree">account_tree</span>
              <span className="font-title-md text-title-md font-semibold text-on-surface">Approval Routing Chain</span>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-[#1E40AF] font-semibold">Tier 2 Escalation</span>
          </div>
          <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
            {/* STEP 1: Sales Manager */}
            <div className="relative flex flex-col">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#ECFDF5] border-2 border-[#10B981] flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-[#065F46]" data-icon="check">check</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-body-md font-semibold text-on-surface">Step 1: Sales Manager</span>
                <span className="font-label-sm text-[10px] text-[#065F46] font-bold uppercase">Auto-authorized</span>
              </div>
              <span className="font-body-sm text-[11px] text-outline">James Carter (Delegated Limit: 15%)</span>
            </div>
            {/* STEP 2: Finance Review */}
            <div className="relative flex flex-col">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#FFFBEB] border-2 border-[#D97706] flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-[12px] text-[#92400E]" data-icon="pending">pending</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-body-md font-semibold text-on-surface">Step 2: Finance Review</span>
                <span className="font-label-sm text-[10px] text-[#92400E] font-bold uppercase">Required</span>
              </div>
              <span className="font-body-sm text-[11px] text-on-surface-variant font-medium">Marcus Vance (VP Finance)</span>
              <span className="font-body-sm text-[10px] text-[#92400E]">Triggered by service discount anomaly (&gt;10%)</span>
            </div>
            {/* STEP 3: VP Commercial */}
            <div className="relative flex flex-col opacity-60">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-surface-bright border-2 border-[#D1D5DB] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-body-md font-semibold text-on-surface">Step 3: VP Commercial</span>
                <span className="font-label-sm text-[10px] text-outline font-bold uppercase">Pending</span>
              </div>
              <span className="font-body-sm text-[11px] text-outline">Elena Rostova (Commercial Governance)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
