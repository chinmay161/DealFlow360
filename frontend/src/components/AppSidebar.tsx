"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
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

  const [imgError, setImgError] = useState(false);

  const userName =
    session?.user?.name ||
    (session?.user?.email ? session.user.email.split("@")[0] : "Commercial User");
  const userEmail = session?.user?.email || "operator@dealflow360.io";
  const userRole =
    (session?.user as { role?: string })?.role === "ADMIN"
      ? "Administrator"
      : (session?.user as { role?: string })?.role === "APPROVER"
      ? "Approval Authority"
      : "Sales Representative";

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "CU";
  const avatarUrl = session?.user?.image;

  const isOverview = pathname === "/overview" || pathname.startsWith("/overview");
  const isApprovals = pathname === "/approvals" || pathname.startsWith("/approvals");
  const isDashboard = !isApprovals && !isOverview && (pathname === "/dashboard" || pathname.startsWith("/dashboard"));
  const isFulfillment = pathname === "/fulfillment" || pathname.startsWith("/fulfillment/");
  const isSubscriptions = pathname === "/subscriptions" || pathname.startsWith("/subscriptions/");
  const isInvoices = pathname === "/invoices" || pathname.startsWith("/invoices/");
  const isReports = pathname === "/reports" || pathname.startsWith("/reports/");
  const isPortal = pathname === "/portal" || pathname.startsWith("/portal/");

  const isQuotations = !isApprovals && !isDashboard && !isOverview && !isFulfillment && !isSubscriptions && !isInvoices && (pathname === "/" || pathname.startsWith("/quotations"));

  return (
    <aside className="w-[260px] h-screen bg-surface-container-lowest border-r border-[#E5E7EB] flex flex-col justify-between flex-shrink-0 z-30 select-none">
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Brand Crest & Platform Name */}
        <div className="h-14 px-space-base flex items-center gap-space-sm border-b border-[#E5E7EB]">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-headline-sm shadow-sm">
            <span className="material-symbols-outlined text-white" data-icon="token">token</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-title-md text-primary font-bold tracking-tight">DealFlow360</span>
            <span className="font-label-sm text-label-sm text-outline tracking-normal">Enterprise Commerce</span>
          </div>
        </div>

        {/* Quick CTA Button */}
        <div className="p-space-base pb-space-xs">
          <Link
            href="/quotations/new"
            className="w-full flex items-center justify-center gap-space-xs px-space-md py-[7px] rounded-lg bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold transition-colors duration-150 shadow-sm"
          >
            <span className="material-symbols-outlined" data-icon="add_circle">add_circle</span>
            <span>Create Quotation</span>
          </Link>
        </div>

        {/* Nav Section: Overview */}
        <div className="px-space-sm mt-space-sm">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">Core</div>
          <Link
            href="/overview"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isOverview
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`material-symbols-outlined ${isOverview ? "text-primary" : "text-outline"}`}
              data-icon="dashboard"
            >
              dashboard
            </span>
            <span>Overview</span>
          </Link>
        </div>

        {/* Nav Section: Sales Group */}
        <div className="px-space-sm mt-space-md">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">Sales</div>
          
          {/* Dashboard Item */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isDashboard
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span className={`material-symbols-outlined ${isDashboard ? "text-primary" : "text-outline"}`} data-icon="trending_up">
              trending_up
            </span>
            <span>Dashboard</span>
          </Link>

          {/* Quotations Item */}
          <Link
            href="/quotations"
            className={`flex items-center justify-between px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isQuotations
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className={`material-symbols-outlined ${isQuotations ? "text-primary" : "text-outline"}`} data-icon="request_quote">
                request_quote
              </span>
              <span>Quotations</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                isQuotations
                  ? "bg-surface-container-highest text-primary"
                  : "bg-surface-container-high text-outline"
              }`}
            >
              12
            </span>
          </Link>

          {/* Approvals Item */}
          <Link
            href="/approvals"
            className={`flex items-center justify-between px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isApprovals
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className={`material-symbols-outlined ${isApprovals ? "text-primary" : "text-outline"}`} data-icon="verified_user">
                verified_user
              </span>
              <span>Approvals</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
              2
            </span>
          </Link>
        </div>

        {/* Nav Section: Operations */}
        <div className="px-space-sm mt-space-md">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">Operations</div>
          <Link
            href="/fulfillment"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isFulfillment
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span className={`material-symbols-outlined ${isFulfillment ? "text-primary" : "text-outline"}`} data-icon="local_shipping">local_shipping</span>
            <span>Fulfillment</span>
          </Link>
          <Link
            href="/subscriptions"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isSubscriptions
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span className={`material-symbols-outlined ${isSubscriptions ? "text-primary" : "text-outline"}`} data-icon="autorenew">autorenew</span>
            <span>Subscriptions</span>
          </Link>
          <Link
            href="/invoices"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isInvoices
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span className={`material-symbols-outlined ${isInvoices ? "text-primary" : "text-outline"}`} data-icon="receipt_long">receipt_long</span>
            <span>Invoices</span>
          </Link>
        </div>

        {/* Nav Section: Intelligence */}
        <div className="px-space-sm mt-space-md">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">Intelligence</div>
          <Link
            href="/quotations"
            className="flex items-center gap-space-sm px-space-md py-[6px] rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low transition-colors duration-150"
          >
            <span className="material-symbols-outlined text-outline" data-icon="health_and_safety">health_and_safety</span>
            <span>Deal Health</span>
          </Link>
          <Link
            href="/reports"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isReports
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span className={`material-symbols-outlined ${isReports ? "text-primary" : "text-outline"}`} data-icon="query_stats">query_stats</span>
            <span>Reports</span>
          </Link>
        </div>

        {/* Nav Section: External Portal */}
        <div className="px-space-sm mt-space-md mb-space-base">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">Buyer Workspace</div>
          <Link
            href="/portal"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isPortal
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span className={`material-symbols-outlined ${isPortal ? "text-primary" : "text-outline"}`} data-icon="storefront">storefront</span>
            <span>Customer Portal</span>
          </Link>
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
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-error hover:bg-error-container/30 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base" data-icon="logout">
                logout
              </span>
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <div
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center justify-between p-space-xs rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors duration-150"
        >
          <div className="flex items-center gap-space-sm min-w-0">
            {avatarUrl && !imgError ? (
              <img
                className="w-8 h-8 rounded-full border border-[#D1D5DB] object-cover flex-shrink-0"
                alt={userName}
                src={avatarUrl}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold flex-shrink-0 border border-[#D1D5DB] shadow-sm select-none">
                {initials}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-title-md text-label-md text-on-surface font-semibold leading-tight truncate">
                {userName}
              </span>
              <span className="font-body-sm text-[11px] text-outline leading-tight truncate">
                {userRole}
              </span>
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-outline hover:text-on-surface transition-transform duration-150 flex-shrink-0 ${
              showMenu ? "rotate-90 text-on-surface" : ""
            }`}
            data-icon="more_vert"
          >
            more_vert
          </span>
        </div>
      </div>
    </aside>
  );
};
