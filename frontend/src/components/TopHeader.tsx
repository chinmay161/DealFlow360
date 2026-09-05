"use client";

import React from "react";

export const TopHeader: React.FC = () => {
  return (
    <header className="h-14 bg-surface-container-lowest border-b border-[#E5E7EB] px-space-xl flex items-center justify-between flex-shrink-0 z-20">
      {/* Search on Left with Cmd+K */}
      <div className="flex items-center gap-space-base w-96">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#64748B]" data-icon="search">search</span>
          <input
            className="w-full h-8 pl-8 pr-14 text-body-sm font-body-sm rounded-md bg-surface-bright border border-[#D1D5DB] text-on-surface placeholder-[#9CA3AF] focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
            placeholder="Search orders, accounts, quotes..."
            type="text"
          />
          <div className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-label-sm text-outline border border-[#D1D5DB]">⌘K</div>
        </div>
      </div>

      {/* Status Indicator & Action Bar */}
      <div className="flex items-center gap-space-base">
        {/* Live WebSocket Connection Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-[#065F46] font-medium">Live Sync Active</span>
        </div>

        {/* Draft Save Status */}
        <div className="flex items-center gap-1 font-body-sm text-body-sm text-outline">
          <span className="material-symbols-outlined text-xs text-[#10B981]" data-icon="check_circle">check_circle</span>
          <span>Auto-saved 2m ago</span>
        </div>

        <div className="h-4 w-px bg-[#E5E7EB]"></div>

        {/* Trailing Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="h-8 px-2.5 rounded-md border border-[#D1D5DB] bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-bright flex items-center gap-1 text-on-surface-variant transition-colors duration-150" title="Quick Export">
            <span className="material-symbols-outlined text-sm" data-icon="file_download">file_download</span>
            <span>Export</span>
          </button>
          <button className="relative w-8 h-8 rounded-md border border-[#D1D5DB] bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors duration-150" title="Notifications">
            <span className="material-symbols-outlined text-sm" data-icon="notifications">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error ring-2 ring-white"></span>
          </button>
          <button className="w-8 h-8 rounded-md border border-[#D1D5DB] bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors duration-150" title="Configure Deal">
            <span className="material-symbols-outlined text-sm" data-icon="tune">tune</span>
          </button>
        </div>
      </div>
    </header>
  );
};
