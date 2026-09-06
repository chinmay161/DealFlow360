"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
  User,
  LogOut,
  MoreVertical,
} from "lucide-react";

import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface ManagerSidebarProps {
  onCloseMobile?: () => void;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ onCloseMobile }) => {
  const pathname = usePathname();
  const { user, initials, roleDisplay } = useCurrentUser();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const userName = user?.name || "Commercial Manager";
  const userEmail = user?.email || "";
  const userRole = user?.title || user?.roleDisplay || roleDisplay;

  const isDashboard = pathname === "/manager/dashboard" || pathname === "/manager";
  const isApprovals = pathname.startsWith("/manager/approvals");
  const isQuotations = pathname.startsWith("/manager/quotations") || pathname.startsWith("/manager/quotation");
  const isAnalytics = pathname.startsWith("/manager/analytics");
  const isAudit = pathname.startsWith("/manager/audit");
  const isProfile = pathname.startsWith("/manager/profile");

  const navItems = [
    {
      label: "Dashboard",
      href: "/manager/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: isDashboard,
    },
    {
      label: "Approval Queue",
      href: "/manager/approvals",
      icon: <ClipboardCheck className="h-4 w-4" />,
      active: isApprovals,
      badge: "Active",
    },
    {
      label: "Quotations",
      href: "/manager/quotations",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      active: isQuotations && !isApprovals,
    },
    {
      label: "Analytics",
      href: "/manager/analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      active: isAnalytics,
    },
    {
      label: "Audit Logs",
      href: "/manager/audit",
      icon: <ShieldCheck className="h-4 w-4" />,
      active: isAudit,
    },
    {
      label: "Profile",
      href: "/manager/profile",
      icon: <User className="h-4 w-4" />,
      active: isProfile,
    },
  ];

  return (
    <aside className="w-[260px] h-screen bg-surface-container-lowest border-r border-[#E5E7EB] flex flex-col justify-between flex-shrink-0 z-30 select-none">
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Brand Crest & Console Title */}
        <Link
          href="/manager/dashboard"
          onClick={onCloseMobile}
          className="h-14 px-space-base flex items-center gap-space-sm border-b border-[#E5E7EB] hover:bg-surface-container-low transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-headline-sm shadow-sm">
            <span className="material-symbols-outlined text-white" data-icon="token">
              token
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-title-md text-primary font-bold tracking-tight truncate">
              DealFlow360
            </span>
            <span className="font-label-sm text-[11px] text-outline tracking-normal truncate">
              Manager Console
            </span>
          </div>
        </Link>

        {/* Manager Mode Badge */}
        <div className="p-space-base pb-space-xs">
          <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container-low border border-primary/20 text-primary">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider">
                Sales Management
              </span>
            </div>
            <span className="text-[10px] font-semibold bg-white px-1.5 py-0.5 rounded border border-primary/20">
              L1 Auth
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-space-sm mt-space-sm space-y-1">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">
            Menu
          </div>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-space-md py-[7px] rounded-lg transition-colors duration-150 ${
                item.active
                  ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                  : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={item.active ? "text-primary" : "text-outline"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom User Operator Profile */}
      <div className="relative p-space-sm border-t border-[#E5E7EB] bg-surface-bright" ref={menuRef}>
        {showMenu && (
          <div className="absolute bottom-full mb-2 left-2 right-2 bg-surface-container-lowest border border-[#E5E7EB] rounded-xl shadow-xl p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-[#F3F4F6]">
              <p className="text-xs font-semibold text-on-surface truncate">{userName}</p>
              <p className="text-[11px] text-outline truncate">{userEmail}</p>
            </div>
            <Link
              href="/manager/profile"
              onClick={() => {
                setShowMenu(false);
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <User className="h-4 w-4 text-slate-500" />
              <span>Manager Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <div
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center justify-between p-space-xs rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors duration-150"
        >
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold flex-shrink-0 border border-[#D1D5DB] shadow-sm select-none">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title-md text-label-md text-on-surface font-semibold leading-tight truncate">
                {userName}
              </span>
              <span className="font-body-sm text-[11px] text-outline leading-tight truncate">
                {userRole}
              </span>
            </div>
          </div>
          <MoreVertical
            className={`h-4 w-4 text-outline hover:text-on-surface transition-transform duration-150 flex-shrink-0 ${
              showMenu ? "rotate-90 text-on-surface" : ""
            }`}
          />
        </div>
      </div>
    </aside>
  );
};
