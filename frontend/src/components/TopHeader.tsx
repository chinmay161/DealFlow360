"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/quotations?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-14 bg-surface-container-lowest border-b border-[#E5E7EB] px-space-xl flex items-center justify-end flex-shrink-0 z-20">
      {/* Relocated Search Bar on Top-Right */}
      <div className="w-80 sm:w-96 max-w-full">
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
    </header>
  );
};

