"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  Clock,
  FileCheck,
  ShieldAlert,
  Sliders,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  type: "high_risk" | "pending" | "overdue" | "policy";
  link?: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "High-Risk Quotation Submitted",
    description: "Quotation #Q-1042 exceeds standard 18% discount limit (Risk Score: 78/100).",
    timeAgo: "12m ago",
    type: "high_risk",
    link: "/manager/quotation/Q-1042",
    read: false,
  },
  {
    id: "n-2",
    title: "New Quotation Awaiting Approval",
    description: "Sales Rep Vikram submitted quotation #Q-1041 for TechCorp India (₹48.5L).",
    timeAgo: "45m ago",
    type: "pending",
    link: "/manager/quotation/Q-1041",
    read: false,
  },
  {
    id: "n-3",
    title: "Approval SLA Overdue Warning",
    description: "Quotation #Q-1039 has been pending manager review for over 24 hours.",
    timeAgo: "2h ago",
    type: "overdue",
    link: "/manager/quotation/Q-1039",
    read: false,
  },
  {
    id: "n-4",
    title: "Commercial Governance Policy Updated",
    description: "Corporate margin floor rule updated from 22% to 25% by Admin.",
    timeAgo: "5h ago",
    type: "policy",
    link: "/manager/audit",
    read: true,
  },
];

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "high_risk":
        return <ShieldAlert className="h-4 w-4 text-rose-600" />;
      case "overdue":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "policy":
        return <Sliders className="h-4 w-4 text-purple-600" />;
      case "pending":
      default:
        return <FileCheck className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-96 max-w-full h-full bg-white shadow-2xl border-l border-[#E5E7EB] flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-14 px-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-title-md text-sm font-bold text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No new notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 group relative ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface truncate">{n.title}</span>
                  </div>
                  <p className="text-xs text-outline mt-0.5 leading-relaxed">{n.description}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{n.timeAgo}</span>
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={onClose}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dismissNotification(n.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity absolute top-3 right-3 p-1"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-slate-50 text-center">
          <span className="text-[11px] text-slate-400">
            Manager Notification Center • DealFlow360
          </span>
        </div>
      </div>
    </div>
  );
};
