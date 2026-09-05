"use client";

import React from "react";

export const DealHealthPanel: React.FC = () => {
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
        <a
          href="#"
          className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-0.5"
        >
          <span>View Intelligence</span>
          <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
            arrow_forward
          </span>
        </a>
      </div>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-3 gap-2 pb-3 border-b border-[#F1F5F9]">
        <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
            Healthy
          </span>
          <span className="font-metric-display text-lg font-bold text-[#065F46] tnum">
            18
          </span>
          <span className="block font-body-sm text-[10px] text-[#065F46]">64% total</span>
        </div>
        <div className="p-2 rounded bg-[#FFFDF5] border border-[#FDE68A]/60">
          <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
            Attention
          </span>
          <span className="font-metric-display text-lg font-bold text-[#92400E] tnum">
            6
          </span>
          <span className="block font-body-sm text-[10px] text-[#92400E]">21% total</span>
        </div>
        <div className="p-2 rounded bg-[#FFF5F5] border border-[#FECDD3]/60">
          <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
            At Risk
          </span>
          <span className="font-metric-display text-lg font-bold text-[#9F1239] tnum">
            4
          </span>
          <span className="block font-body-sm text-[10px] text-[#9F1239]">15% total</span>
        </div>
      </div>

      {/* Compact Distribution Visualization Bar */}
      <div className="mt-3">
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 mb-3">
          <div className="bg-[#10B981] h-full" style={{ width: "64%" }} title="Healthy: 64%"></div>
          <div className="bg-[#F59E0B] h-full" style={{ width: "21%" }} title="Needs Attention: 21%"></div>
          <div className="bg-[#E11D48] h-full" style={{ width: "15%" }} title="At Risk: 15%"></div>
        </div>

        {/* Detailed Horizontal Breakdown */}
        <div className="space-y-2 font-body-sm text-[11px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              <span className="text-on-surface-variant font-medium">Healthy</span>
            </div>
            <span className="font-code-tabular font-bold text-on-surface tnum">64%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              <span className="text-on-surface-variant font-medium">Needs Attention</span>
            </div>
            <span className="font-code-tabular font-bold text-on-surface tnum">21%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E11D48]"></span>
              <span className="text-on-surface-variant font-medium">At Risk</span>
            </div>
            <span className="font-code-tabular font-bold text-[#9F1239] tnum">15%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
