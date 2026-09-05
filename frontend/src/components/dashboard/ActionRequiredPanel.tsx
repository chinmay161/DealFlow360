"use client";

import React from "react";
import Link from "next/link";

interface ActionItem {
  id: string;
  dealId: string;
  customer: string;
  role?: string;
  assignee?: string;
  timeAgo?: string;
  priority: string;
  href: string;
}

interface ActionRequiredPanelProps {
  items?: ActionItem[];
}

export const ActionRequiredPanel: React.FC<ActionRequiredPanelProps> = ({ items = [] }) => {
  const displayItems = items || [];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E11D48] text-base" data-icon="assignment_late">
              assignment_late
            </span>
            <h3 className="font-title-md text-title-md font-semibold text-on-surface">
              Action Required
            </h3>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              displayItems.length > 0
                ? "bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {displayItems.length > 0 ? `${displayItems.length} Critical` : "Compliant"}
          </span>
        </div>

        {/* Action Items List */}
        <div className="space-y-2.5">
          {displayItems.length === 0 ? (
            <div className="py-6 text-center text-outline">
              <span className="material-symbols-outlined text-3xl text-emerald-500 mb-1" data-icon="check_circle">
                check_circle
              </span>
              <p className="text-body-sm font-medium text-on-surface">No Critical Actions Pending</p>
              <p className="text-[11px] text-outline mt-0.5">All active deals are within governance thresholds.</p>
            </div>
          ) : (
            displayItems.slice(0, 4).map((item) => {
            const isHigh = item.priority === "HIGH" || item.priority === "URGENT";
            return (
              <div
                key={item.id}
                className="p-2.5 rounded-md border border-[#F1F5F9] hover:border-[#E5E7EB] hover:bg-[#F8FAFC] transition-all flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-code-tabular text-body-sm font-bold text-primary">
                      {item.dealId}
                    </span>
                    <span className="font-label-sm text-outline">•</span>
                    <span className="font-title-md text-xs font-semibold text-on-surface truncate">
                      {item.customer}
                    </span>
                  </div>
                  <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    {item.role || "Requires approval review"} · {item.assignee || "Assigned Approver"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                      isHigh
                        ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                        : "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                    }`}
                  >
                    {isHigh ? "High Priority" : "Standard"}
                  </span>
                  <Link
                    href={item.href || "/approvals"}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Review</span>
                    <span className="material-symbols-outlined text-[11px]" data-icon="chevron_right">chevron_right</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#F1F5F9] mt-3 flex items-center justify-between font-body-sm text-[11px] text-outline">
        <span>Prioritized by risk score</span>
        <Link href="/approvals" className="font-medium text-primary hover:underline">
          Open Approvals Console &rarr;
        </Link>
      </div>
    </div>
  );
};
