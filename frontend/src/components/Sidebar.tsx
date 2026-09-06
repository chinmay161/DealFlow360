"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/components/ui/card";
import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, initials, roleDisplay } = useCurrentUser();
  const [imgError, setImgError] = React.useState(false);
  const displayName = user?.name || "Commercial User";
  const displayRole = user?.roleDisplay || roleDisplay;

  const navLinks = [
    {
      name: "Dashboard",
      href: "/customer/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/customer/dashboard" || pathname === "/customer",
    },
    {
      name: "Quotations",
      href: "/customer/quotations",
      icon: FileText,
      active: pathname === "/customer/quotations" || pathname.startsWith("/customer/quotations/"),
    },
    {
      name: "Profile",
      href: "/customer/profile",
      icon: User,
      active: pathname === "/customer/profile",
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <aside className="h-full w-64 flex flex-col bg-white border-r border-slate-200/80 dark:bg-slate-950 dark:border-slate-800 select-none shadow-[2px_0_12px_-4px_rgba(0,0,0,0.03)]">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
        <Link
          href="/customer/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
              DealFlow360
            </span>
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
              Commercial Hub
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Commercial Management
        </div>

        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                link.active
                  ? "bg-blue-50/80 text-blue-700 shadow-sm border border-blue-100/80 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  link.active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Section & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1 bg-slate-50/50 dark:bg-slate-900/30">
        <Link
          href="/customer/profile"
          onClick={onCloseMobile}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
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
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {displayName}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {displayRole}
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
