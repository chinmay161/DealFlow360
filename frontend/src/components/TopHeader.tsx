"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/quotations?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-14 bg-surface-container-lowest border-b border-[#E5E7EB] px-space-xl flex items-center justify-between flex-shrink-0 z-20">
      {/* Search on Left with Cmd+K */}
      <div className="flex items-center gap-space-base w-96">
        <div className="relative w-full">
          <span
            className="material-symbols-outlined absolute left-2.5 top-2 text-[#64748B]"
            data-icon="search"
          >
            search
          </span>
          <input
            className="w-full h-8 pl-8 pr-14 text-body-sm font-body-sm rounded-md bg-surface-bright border border-[#D1D5DB] text-on-surface placeholder-[#9CA3AF] focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
            placeholder="Search quotes, accounts, orders..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <div className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-label-sm text-outline border border-[#D1D5DB]">
            ↵ Enter
          </div>
        </div>
      </div>

      {/* Status Indicator & Action Bar */}
      <div className="flex items-center gap-space-base">
        {/* PostgreSQL Database Connected Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-[#065F46] font-medium">
            PostgreSQL Connected
          </span>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-1 font-body-sm text-body-sm text-outline">
          <span
            className="material-symbols-outlined text-xs text-[#10B981]"
            data-icon="check_circle"
          >
            check_circle
          </span>
          <span>Engine Online</span>
        </div>

        <div className="h-4 w-px bg-[#E5E7EB]"></div>

        {/* Trailing Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/reports"
            className="h-8 px-2.5 rounded-md border border-[#D1D5DB] bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-bright flex items-center gap-1 text-on-surface-variant transition-colors duration-150"
            title="Commercial Reports"
          >
            <span className="material-symbols-outlined text-sm" data-icon="file_download">
              file_download
            </span>
            <span>Export</span>
          </Link>
          <Link
            href="/approvals"
            className="relative w-8 h-8 rounded-md border border-[#D1D5DB] bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors duration-150"
            title="Pending Approvals"
          >
            <span className="material-symbols-outlined text-sm" data-icon="notifications">
              notifications
            </span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error ring-2 ring-white"></span>
          </Link>
          <Link
            href="/configuration"
            className="w-8 h-8 rounded-md border border-[#D1D5DB] bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors duration-150"
            title="Governance & Policy Configuration"
          >
            <span className="material-symbols-outlined text-sm" data-icon="tune">
              tune
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};
