"use client";

import React from "react";
import Link from "next/link";

export const DashboardHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between pb-space-xs">
      <div>
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
          Dashboard
        </h1>
        <p className="font-body-sm text-body-sm text-outline mt-0.5">
          Monitor your active deals, approvals, revenue, and operational activity.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Subtle Date Context */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#D1D5DB] text-label-sm text-[#475569] shadow-sm">
          <span className="material-symbols-outlined text-xs text-outline" data-icon="calendar_today">
            calendar_today
          </span>
          <span className="font-medium">September 2026</span>
        </div>

        {/* Primary CTA: Create Quotation */}
        <Link
          href="/"
          className="h-8 px-3 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-sm" data-icon="add_circle">
            add_circle
          </span>
          <span>Create Quotation</span>
        </Link>
      </div>
    </div>
  );
};
