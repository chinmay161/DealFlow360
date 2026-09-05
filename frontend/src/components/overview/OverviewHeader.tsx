"use client";

import React, { useState } from "react";

export const OverviewHeader: React.FC = () => {
  const [timeRange, setTimeRange] = useState("September 2026");

  return (
    <div className="flex items-center justify-between pb-space-xs">
      <div>
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
          Overview
        </h1>
        <p className="font-body-sm text-body-sm text-outline mt-0.5">
          Your complete view of sales performance, commercial activity, and operational health.
        </p>
      </div>

      <div className="flex items-center">
        {/* Date/Month Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#D1D5DB] text-label-sm text-[#475569] shadow-sm">
          <span className="material-symbols-outlined text-xs text-outline" data-icon="calendar_today">
            calendar_today
          </span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent font-medium text-xs text-on-surface focus:outline-none cursor-pointer"
            aria-label="Select overview time period"
          >
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
            <option value="Q3 2026">Q3 2026</option>
            <option value="YTD 2026">YTD 2026 (FY26)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
