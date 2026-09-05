"use client";

import React from "react";
import Link from "next/link";

interface ActionItem {
  id: string;
  dealId: string;
  customer: string;
  reason: string;
  priority: "High" | "Medium";
  actionText: string;
  href?: string;
}

const actionItems: ActionItem[] = [
  {
    id: "act-1",
    dealId: "Q-1042",
    customer: "Acme Corporation",
    reason: "Finance approval pending.",
    priority: "High",
    actionText: "Review Approval →",
    href: "/",
  },
  {
    id: "act-2",
    dealId: "Q-1029",
    customer: "Orion Manufacturing",
    reason: "Margin below configured target.",
    priority: "High",
    actionText: "Review Deal →",
  },
  {
    id: "act-3",
    dealId: "Q-1031",
    customer: "Nova Systems",
    reason: "Customer counteroffer received.",
    priority: "Medium",
    actionText: "Open Negotiation →",
  },
  {
    id: "act-4",
    dealId: "Q-1037",
    customer: "Apex Logistics",
    reason: "Quote inactive for 6 days.",
    priority: "Medium",
    actionText: "Follow Up →",
  },
];

export const ActionRequiredPanel: React.FC = () => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E11D48] text-base" data-icon="assignment_late">
              assignment_late
            </span>
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">
              Action Required
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-label-sm font-semibold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
            6 items require attention
          </span>
        </div>

        {/* Action Items List */}
        <div className="divide-y divide-[#F1F5F9] space-y-2.5">
          {actionItems.map((item, idx) => (
            <div key={item.id} className={`${idx === 0 ? "" : "pt-2.5"} flex flex-col gap-1`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      item.priority === "High"
                        ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                        : "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                  <span className="font-code-tabular text-xs font-bold text-primary">
                    {item.dealId}
                  </span>
                </div>
                <span className="font-body-sm text-[11px] text-outline truncate max-w-[120px]">
                  {item.customer}
                </span>
              </div>

              <div className="flex items-center justify-between mt-0.5">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {item.reason}
                </p>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="font-label-md text-xs font-semibold text-secondary hover:underline shrink-0 ml-2"
                  >
                    {item.actionText}
                  </Link>
                ) : (
                  <a
                    href="#"
                    className="font-label-md text-xs font-semibold text-secondary hover:underline shrink-0 ml-2"
                  >
                    {item.actionText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
