"use client";

import React, { useState } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { NotificationDrawer } from "./NotificationDrawer";

interface ManagerTopHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const ManagerTopHeader: React.FC<ManagerTopHeaderProps> = ({ onOpenMobileMenu }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <>
      <header className="h-14 bg-surface-container-lowest border-b border-[#E5E7EB] px-space-xl flex items-center justify-between flex-shrink-0 z-20">
        {/* Left: Mobile Toggle & Search */}
        <div className="flex items-center gap-space-base">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
              aria-label="Open sidebar navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="relative w-80 max-w-sm hidden sm:block">
            <Search className="h-4 w-4 absolute left-2.5 top-2 text-[#64748B]" />
            <input
              className="w-full h-8 pl-8 pr-14 text-body-sm font-body-sm rounded-md bg-surface-bright border border-[#D1D5DB] text-on-surface placeholder-[#9CA3AF] focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
              placeholder="Search quotes, policies, accounts..."
              type="text"
            />
            <div className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-label-sm text-outline border border-[#D1D5DB]">
              ⌘K
            </div>
          </div>
        </div>

        {/* Right: Live Sync & Action Bar */}
        <div className="flex items-center gap-space-base">
          {/* Live Sync Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-label-sm text-[11px] text-[#065F46] font-medium hidden sm:inline">
              Manager Sync Active
            </span>
          </div>

          <div className="h-4 w-px bg-[#E5E7EB] hidden sm:block"></div>

          {/* Trailing Notification Button */}
          <button
            type="button"
            onClick={() => setNotificationOpen(true)}
            className="relative w-8 h-8 rounded-md border border-[#D1D5DB] bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors duration-150 cursor-pointer"
            title="Manager Notifications"
          >
            <Bell className="h-4 w-4 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>
        </div>
      </header>

      <NotificationDrawer
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
};
