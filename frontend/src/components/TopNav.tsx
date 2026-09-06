"use client";

import React, { useState, useEffect } from "react";
import { Search, Menu, Command } from "lucide-react";
import { NotificationDropdown } from "@/features/notifications/NotificationDropdown";
import { GlobalSearchModal } from "@/features/search/GlobalSearchModal";
import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface TopNavProps {
  onOpenMobileMenu: () => void;
}

export function TopNav({ onOpenMobileMenu }: TopNavProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { user, initials, roleDisplay } = useCurrentUser();
  const displayName = user?.name || "Commercial User";
  const displayRole = user?.roleDisplay || roleDisplay;

  // Keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 w-full flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 dark:bg-slate-950/80 dark:border-slate-800">
        {/* Left: Mobile hamburger & Search bar */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all text-xs group dark:bg-slate-900/60 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
              <span>Search quotations, products, customers...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-3">
          <NotificationDropdown />

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

          <Link
            href="/customer/profile"
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform overflow-hidden">
              {user?.image && !imgError ? (
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors leading-tight truncate max-w-[140px]">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-none truncate max-w-[140px]">
                {displayRole}
              </span>
            </div>
          </Link>
        </div>
      </header>

      <GlobalSearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
}
