"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard");
  const isQuotations = !isDashboard && (pathname === "/" || pathname.startsWith("/quotations"));

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
            href="/"
            className="w-full flex items-center justify-center gap-space-xs px-space-md py-[7px] rounded-lg bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold transition-colors duration-150 shadow-sm"
          >
            <span className="material-symbols-outlined" data-icon="add_circle">add_circle</span>
            <span>Create Quotation</span>
          </Link>
        </div>

        {/* Nav Section: Overview */}
        <div className="px-space-sm mt-space-sm">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">Core</div>
          <a className="flex items-center gap-space-sm px-space-md py-[6px] rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low transition-colors duration-150" href="#">
            <span className="material-symbols-outlined text-outline" data-icon="dashboard">dashboard</span>
            <span>Overview</span>
          </a>
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
            href="/"
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
          <a className="flex items-center justify-between px-space-md py-[6px] rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low transition-colors duration-150" href="#">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-outline" data-icon="verified_user">verified_user</span>
              <span>Approvals</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">2</span>
          </a>
        </div>

        {/* Nav Section: Operations */}
        <div className="px-space-sm mt-space-md">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">Operations</div>
          <a className="flex items-center gap-space-sm px-space-md py-[6px] rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low transition-colors duration-150" href="#">
            <span className="material-symbols-outlined text-outline" data-icon="local_shipping">local_shipping</span>
            <span>Fulfillment</span>
          </a>
          <a className="flex items-center gap-space-sm px-space-md py-[6px] rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low transition-colors duration-150" href="#">
            <span className="material-symbols-outlined text-outline" data-icon="autorenew">autorenew</span>
            <span>Subscriptions</span>
          </a>
          <a className="flex items-center gap-space-sm px-space-md py-[6px] rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low transition-colors duration-150" href="#">
            <span className="material-symbols-outlined text-outline" data-icon="receipt_long">receipt_long</span>
            <span>Invoices</span>
          </a>
        </div>

        {/* Nav Section: Intelligence */}
        <div className="px-space-sm mt-space-md">
          <div className="px-space-sm py-1 font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">Intelligence</div>
          <a className="flex items-center gap-space-sm px-space-md py-[6px] rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low transition-colors duration-150" href="#">
            <span className="material-symbols-outlined text-outline" data-icon="health_and_safety">health_and_safety</span>
            <span>Deal Health</span>
          </a>
          <a className="flex items-center gap-space-sm px-space-md py-[6px] rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low transition-colors duration-150" href="#">
            <span className="material-symbols-outlined text-outline" data-icon="query_stats">query_stats</span>
            <span>Reports</span>
          </a>
        </div>
      </div>

      {/* Bottom User Operator Profile */}
      <div className="p-space-sm border-t border-[#E5E7EB] bg-surface-bright">
        <div className="flex items-center justify-between p-space-xs rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors duration-150">
          <div className="flex items-center gap-space-sm">
            <img
              className="w-8 h-8 rounded-full border border-[#D1D5DB] object-cover"
              alt="James Carter"
              src="/james-carter.jpg"
            />
            <div className="flex flex-col">
              <span className="font-title-md text-label-md text-on-surface font-semibold leading-tight">James Carter</span>
              <span className="font-body-sm text-[11px] text-outline leading-tight">Sales Manager</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline hover:text-on-surface" data-icon="more_vert">more_vert</span>
        </div>
      </div>
    </aside>
  );
};
