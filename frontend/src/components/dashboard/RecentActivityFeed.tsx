"use client";

import React from "react";

interface ActivityItem {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: React.ReactNode;
  timestamp: string;
}

const activities: ActivityItem[] = [
  {
    id: "act-1",
    icon: "send",
    iconColor: "text-primary",
    iconBg: "bg-[#EFF6FF] border-[#BFDBFE]",
    title: (
      <span>
        <strong className="font-semibold text-on-surface">James Carter</strong> submitted{" "}
        <strong className="font-semibold text-primary">Q-1042</strong> for approval.
      </span>
    ),
    timestamp: "2 minutes ago",
  },
  {
    id: "act-2",
    icon: "edit_note",
    iconColor: "text-[#D97706]",
    iconBg: "bg-[#FFFBEB] border-[#FDE68A]",
    title: (
      <span>
        <strong className="font-semibold text-on-surface">Marcus Vance</strong> requested changes to{" "}
        <strong className="font-semibold text-on-surface">Q-1038</strong>.
      </span>
    ),
    timestamp: "18 minutes ago",
  },
  {
    id: "act-3",
    icon: "handshake",
    iconColor: "text-secondary",
    iconBg: "bg-[#EFF6FF] border-[#BFDBFE]",
    title: (
      <span>
        <strong className="font-semibold text-on-surface">Northstar Technologies</strong> submitted a counteroffer.
      </span>
    ),
    timestamp: "42 minutes ago",
  },
  {
    id: "act-4",
    icon: "inventory_2",
    iconColor: "text-[#475569]",
    iconBg: "bg-[#F8FAFC] border-[#E2E8F0]",
    title: (
      <span>
        <strong className="font-semibold text-on-surface">Inventory updated:</strong> 27-inch 4K Studio Display stock changed.
      </span>
    ),
    timestamp: "1 hour ago",
  },
  {
    id: "act-5",
    icon: "check_circle",
    iconColor: "text-[#065F46]",
    iconBg: "bg-[#ECFDF5] border-[#A7F3D0]",
    title: (
      <span>
        <strong className="font-semibold text-on-surface">Invoice INV-2041</strong> was successfully paid.
      </span>
    ),
    timestamp: "2 hours ago",
  },
];

export const RecentActivityFeed: React.FC = () => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base" data-icon="schedule">
            schedule
          </span>
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">
            Recent Activity
          </h2>
        </div>
        <a
          href="#"
          className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-0.5"
        >
          <span>View All Activity</span>
          <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
            arrow_forward
          </span>
        </a>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-[#F1F5F9]">
        {activities.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center justify-between py-2.5 ${
              idx === 0 ? "pt-1" : ""
            } hover:bg-[#F8FAFC] px-2 rounded transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${item.iconBg}`}
              >
                <span className={`material-symbols-outlined text-sm ${item.iconColor}`} data-icon={item.icon}>
                  {item.icon}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {item.title}
              </p>
            </div>
            <span className="font-body-sm text-[11px] text-outline shrink-0 ml-4">
              {item.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
