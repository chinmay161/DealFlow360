"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, initials, roleDisplay } = useCurrentUser();
  const [showMenu, setShowMenu] = useState(false);
  const [counts, setCounts] = useState<{ quotesCount: number; pendingApprovalsCount: number }>({
    quotesCount: 12,
    pendingApprovalsCount: 2,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/counts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && isMounted) {
          setCounts({
            quotesCount: data.quotesCount ?? 0,
            pendingApprovalsCount: data.pendingApprovalsCount ?? 0,
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [pathname]);

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

  const userName = user?.name || "Commercial User";
  const userEmail = user?.email || "";
  const userRole = user?.roleDisplay || roleDisplay;
  const avatarUrl = user?.image;

  const isOverview = pathname === "/overview" || pathname.startsWith("/overview") || pathname === "/";
  const isApprovals = pathname === "/approvals" || pathname.startsWith("/approvals");
  const isDashboard = !isApprovals && !isOverview && (pathname === "/dashboard" || pathname.startsWith("/dashboard"));
  const isCustomers = pathname === "/customers" || pathname.startsWith("/customers");
  const isFulfillment = pathname === "/fulfillment" || pathname.startsWith("/fulfillment/");
  const isSubscriptions = pathname === "/subscriptions" || pathname.startsWith("/subscriptions/");
  const isInvoices = pathname === "/invoices" || pathname.startsWith("/invoices/");
  const isReports = pathname === "/reports" || pathname.startsWith("/reports/");
  const isConfiguration = pathname === "/configuration" || pathname.startsWith("/configuration");
  const isAudit = pathname === "/audit" || pathname.startsWith("/audit");

  const isQuotations =
    !isApprovals &&
    !isDashboard &&
    !isOverview &&
    !isCustomers &&
    !isFulfillment &&
    !isSubscriptions &&
    !isInvoices &&
    !isConfiguration &&
    !isAudit &&
    pathname.startsWith("/quotations");

  return (
    <aside className="w-[260px] h-screen bg-surface-container-lowest border-r border-[#E5E7EB] flex flex-col justify-between flex-shrink-0 z-30 select-none">
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Brand Crest & Platform Name */}
        <Link
          href="/overview"
          className="h-14 px-space-base flex items-center gap-space-sm border-b border-[#E5E7EB] hover:bg-surface-container-low transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-headline-sm shadow-sm">
            <span className="material-symbols-outlined text-white" data-icon="token">
              token
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-title-md text-primary font-bold tracking-tight">
              DealFlow360
            </span>
            <span className="font-label-sm text-label-sm text-outline tracking-normal">
              Enterprise Commerce
            </span>
          </div>
        </Link>

        {/* Nav Section: Core */}
        <div className="px-space-sm mt-space-sm">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">
            Core
          </div>
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
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">
            Sales
          </div>

          {/* Dashboard Item */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isDashboard
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`material-symbols-outlined ${isDashboard ? "text-primary" : "text-outline"}`}
              data-icon="trending_up"
            >
              trending_up
            </span>
            <span>Dashboard</span>
          </Link>

          {/* Customers Directory */}
          <Link
            href="/customers"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isCustomers
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`material-symbols-outlined ${isCustomers ? "text-primary" : "text-outline"}`}
              data-icon="corporate_fare"
            >
              corporate_fare
            </span>
            <span>Accounts &amp; Customers</span>
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
              <span
                className={`material-symbols-outlined ${isQuotations ? "text-primary" : "text-outline"}`}
                data-icon="request_quote"
              >
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
              {counts.quotesCount}
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
              <span
                className={`material-symbols-outlined ${isApprovals ? "text-primary" : "text-outline"}`}
                data-icon="verified_user"
              >
                verified_user
              </span>
              <span>Approvals</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
              {counts.pendingApprovalsCount}
            </span>
          </Link>
        </div>

        {/* Nav Section: Operations */}
        <div className="px-space-sm mt-space-md">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">
            Operations
          </div>
          <Link
            href="/fulfillment"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isFulfillment
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`material-symbols-outlined ${isFulfillment ? "text-primary" : "text-outline"}`}
              data-icon="local_shipping"
            >
              local_shipping
            </span>
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
            <span
              className={`material-symbols-outlined ${isSubscriptions ? "text-primary" : "text-outline"}`}
              data-icon="autorenew"
            >
              autorenew
            </span>
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
            <span
              className={`material-symbols-outlined ${isInvoices ? "text-primary" : "text-outline"}`}
              data-icon="receipt_long"
            >
              receipt_long
            </span>
            <span>Invoices</span>
          </Link>
        </div>

        {/* Nav Section: Governance & Audit */}
        <div className="px-space-sm mt-space-md">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">
            Governance &amp; Controls
          </div>
          <Link
            href="/configuration"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isConfiguration
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`material-symbols-outlined ${isConfiguration ? "text-primary" : "text-outline"}`}
              data-icon="policy"
            >
              policy
            </span>
            <span>Policy Config</span>
          </Link>
          <Link
            href="/audit"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isAudit
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`material-symbols-outlined ${isAudit ? "text-primary" : "text-outline"}`}
              data-icon="history"
            >
              history
            </span>
            <span>Audit Ledger</span>
          </Link>
          <Link
            href="/reports"
            className={`flex items-center gap-space-sm px-space-md py-[6px] rounded-lg transition-colors duration-150 ${
              isReports
                ? "bg-surface-container-low text-primary font-title-md text-body-md font-semibold"
                : "text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`material-symbols-outlined ${isReports ? "text-primary" : "text-outline"}`}
              data-icon="query_stats"
            >
              query_stats
            </span>
            <span>Reports</span>
          </Link>
        </div>

      </div>

      {/* Bottom User Operator Profile */}
      <div className="relative p-space-sm border-t border-[#E5E7EB] bg-surface-bright" ref={menuRef}>
        {showMenu && (
          <div className="absolute bottom-full mb-2 left-2 right-2 bg-surface-container-lowest border border-[#E5E7EB] rounded-xl shadow-xl p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-[#F3F4F6]">
              <p className="text-xs font-semibold text-on-surface truncate">{userName}</p>
              <p className="text-[10px] text-outline truncate">{userEmail}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-medium text-primary">
                {userRole}
              </span>
            </div>
            <div className="py-1">
              <Link
                href="/customer/profile"
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low rounded-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm" data-icon="person">
                  person
                </span>
                Profile &amp; Settings
              </Link>
              <Link
                href="/configuration"
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low rounded-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm" data-icon="settings">
                  settings
                </span>
                Rules &amp; Governance
              </Link>
              <Link
                href="/audit"
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low rounded-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm" data-icon="history">
                  history
                </span>
                Compliance Logs
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-sm" data-icon="logout">
                  logout
                </span>
                Sign Out
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-center gap-space-sm p-1.5 rounded-lg hover:bg-surface-container-low transition-colors duration-150 text-left"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-label-md text-label-md font-semibold text-on-surface truncate">
              {userName}
            </div>
            <div className="font-label-sm text-[11px] text-outline truncate">{userRole}</div>
          </div>
          <span className="material-symbols-outlined text-outline text-sm" data-icon="unfold_more">
            unfold_more
          </span>
        </button>
      </div>
    </aside>
  );
};
