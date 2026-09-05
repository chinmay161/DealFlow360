"use client";

import React from "react";

interface ApprovalSummaryCardsProps {
  pendingCount?: number;
  highPriorityCount?: number;
  approvedCount?: number;
}

export const ApprovalSummaryCards: React.FC<ApprovalSummaryCardsProps> = ({
  pendingCount = 12,
  highPriorityCount = 3,
  approvedCount = 8,
}) => {
  return (
    <div className="grid grid-cols-4 gap-space-base">
      {/* CARD 1: PENDING REVIEW */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Pending Review
          </span>
          <span className="material-symbols-outlined text-[#D97706] text-base" data-icon="pending_actions">
            pending_actions
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            {pendingCount}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            Active Queue
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Action status</span>
          <span className="font-medium text-[#92400E]">Requires your attention</span>
        </div>
      </div>

      {/* CARD 2: HIGH PRIORITY */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            High Priority
          </span>
          <span className="material-symbols-outlined text-[#E11D48] text-base" data-icon="priority_high">
            priority_high
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-[#9F1239] tnum">
            {highPriorityCount}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]"></span>
            Escalations
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Governance tier</span>
          <span className="font-medium text-[#9F1239]">High-risk commercial exceptions</span>
        </div>
      </div>

      {/* CARD 3: APPROVED TODAY */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Approved Deals
          </span>
          <span className="material-symbols-outlined text-[#065F46] text-base" data-icon="task_alt">
            task_alt
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-[#065F46] tnum">
            {approvedCount}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
            Cleared
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Velocity</span>
          <span className="font-medium text-[#065F46]">Ready for order fulfillment</span>
        </div>
      </div>

      {/* CARD 4: AVG TURNAROUND */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Avg. Turnaround
          </span>
          <span className="material-symbols-outlined text-outline text-base" data-icon="schedule">
            schedule
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="font-metric-display text-metric-display font-bold text-on-surface tnum">
            1.4h
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <span className="material-symbols-outlined text-[11px]" data-icon="trending_down">trending_down</span>
            -18% vs target
          </span>
        </div>
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>SLA target: 4.0h</span>
          <span className="font-medium text-[#065F46]">98.2% in SLA</span>
        </div>
      </div>
    </div>
  );
};
