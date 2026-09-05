"use client";

import React from "react";
import Link from "next/link";

interface DealHealthPanelProps {
  dealHealth?: {
    lowRiskCount: number;
    mediumRiskCount: number;
    highRiskCount: number;
    totalCount: number;
  };
}

export const DealHealthPanel: React.FC<DealHealthPanelProps> = ({ dealHealth }) => {
  const low = dealHealth?.lowRiskCount ?? 18;
  const med = dealHealth?.mediumRiskCount ?? 6;
  const high = dealHealth?.highRiskCount ?? 4;
  const total = dealHealth?.totalCount || (low + med + high) || 1;

  const lowPct = Math.round((low / total) * 100);
  const medPct = Math.round((med / total) * 100);
  const highPct = Math.round((high / total) * 100);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base" data-icon="health_and_safety">
            health_and_safety
          </span>
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">
            Deal Health
          </h2>
        </div>
        <Link
          href="/quotations?view=list"
          className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-0.5"
        >
          <span>View All Deals</span>
          <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
            arrow_forward
          </span>
        </Link>
      </div>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-3 gap-2 pb-3 border-b border-[#F1F5F9]">
        <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
            Healthy
          </span>
          <span className="font-metric-display text-lg font-bold text-[#065F46] tnum">
            {low}
          </span>
          <span className="block font-body-sm text-[10px] text-[#065F46]">{lowPct}% total</span>
        </div>
        <div className="p-2 rounded bg-[#FFFDF5] border border-[#FDE68A]/60">
          <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
            Attention
          </span>
          <span className="font-metric-display text-lg font-bold text-[#92400E] tnum">
            {med}
          </span>
          <span className="block font-body-sm text-[10px] text-[#92400E]">{medPct}% total</span>
        </div>
        <div className="p-2 rounded bg-[#FFF5F5] border border-[#FECDD3]/60">
          <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
            At Risk
          </span>
          <span className="font-metric-display text-lg font-bold text-[#9F1239] tnum">
            {high}
          </span>
          <span className="block font-body-sm text-[10px] text-[#9F1239]">{highPct}% total</span>
        </div>
      </div>

      {/* Compact Distribution Visualization Bar */}
      <div className="pt-3">
        <div className="flex items-center justify-between text-body-sm text-[11px] text-outline mb-1.5">
          <span>Risk Distribution</span>
          <span className="font-medium text-on-surface">{total} evaluated quotations</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex bg-surface-container">
          <div
            className="h-full bg-[#10B981] transition-all duration-500"
            style={{ width: `${lowPct}%` }}
            title={`Healthy: ${low} deals`}
          />
          <div
            className="h-full bg-[#F59E0B] transition-all duration-500"
            style={{ width: `${medPct}%` }}
            title={`Attention: ${med} deals`}
          />
          <div
            className="h-full bg-[#EF4444] transition-all duration-500"
            style={{ width: `${highPct}%` }}
            title={`At Risk: ${high} deals`}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-outline mt-2 pt-2 border-t border-[#F1F5F9]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Healthy (&lt;40)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            Attention (40-69)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            At Risk (&ge;70)
          </span>
        </div>
      </div>
    </div>
  );
};
