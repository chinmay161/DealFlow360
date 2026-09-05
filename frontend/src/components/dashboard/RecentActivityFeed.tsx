"use client";

import React from "react";
import Link from "next/link";

interface RecentActivityFeedProps {
  activities?: Array<{
    id: string;
    actorName: string;
    dealId: string;
    action: string;
    notes?: string | null;
    timestamp: string;
  }>;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const displayActivities = activities && activities.length > 0 ? activities : [
    {
      id: "act-1",
      actorName: "Arjun Mehta",
      dealId: "Q-1042",
      action: "Submitted for approval",
      notes: "Stage 1 approval chain initiated",
      timestamp: new Date().toISOString(),
    },
    {
      id: "act-2",
      actorName: "Vikram Desai",
      dealId: "Q-1041",
      action: "Stage Approved",
      notes: "Sales Management approved discount terms",
      timestamp: new Date().toISOString(),
    },
    {
      id: "act-3",
      actorName: "Meera Joshi",
      dealId: "Q-1038",
      action: "Changes Requested",
      notes: "Margin adjustment requested",
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline text-base" data-icon="history">
            history
          </span>
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">
            Commercial Audit &amp; Activity Log
          </h2>
          <span className="text-label-sm font-label-sm text-outline">
            Real-time PostgreSQL Audit Trail
          </span>
        </div>
        <Link
          href="/approvals"
          className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-0.5"
        >
          <span>View All Approvals</span>
          <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
            arrow_forward
          </span>
        </Link>
      </div>

      {/* Activity Items */}
      <div className="divide-y divide-[#F1F5F9]">
        {displayActivities.slice(0, 5).map((item) => (
          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-body-sm">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xs" data-icon="verified_user">verified_user</span>
              </div>
              <div>
                <span className="text-on-surface">
                  <strong className="font-semibold text-on-surface">{item.actorName}</strong>{" "}
                  {item.action}{" "}
                  <Link href={`/quotations/${item.dealId}`} className="font-code-tabular font-bold text-primary hover:underline">
                    {item.dealId}
                  </Link>
                </span>
                {item.notes && (
                  <p className="text-[11px] text-outline mt-0.5">{item.notes}</p>
                )}
              </div>
            </div>
            <span className="text-[11px] font-code-tabular text-outline flex-shrink-0">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
