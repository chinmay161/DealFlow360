"use client";

import React, { useState } from "react";
import { useManagerAnalytics } from "../../hooks/useManagerAnalytics";
import { AnalyticsKpiCards } from "../../features/analytics/AnalyticsKpiCards";
import { AnalyticsCharts } from "../../features/analytics/AnalyticsCharts";
import { SkeletonCard, SkeletonChart } from "../../components/LoadingSkeletons";
import { EmptyState } from "../../components/EmptyState";
import { RefreshCw } from "lucide-react";

export default function ManagerAnalyticsPage() {
  const [timeframe, setTimeframe] = useState("30D");
  const { data, isLoading, isError, refetch } = useManagerAnalytics(timeframe);

  const timeframes = [
    { label: "7 Days", value: "7D" },
    { label: "30 Days", value: "30D" },
    { label: "90 Days", value: "90D" },
    { label: "1 Year", value: "1Y" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-space-xs">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
            Commercial Governance Analytics
          </h1>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">
            Evaluate approval turnaround velocity, policy compliance exceptions, and revenue clearance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector tabs */}
          <div className="flex items-center p-1 bg-white border border-[#D1D5DB] rounded-lg shadow-xs">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeframe === tf.value
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 hover:text-on-surface"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="h-8 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-base">
          <SkeletonCard count={5} />
        </div>
      ) : isError ? (
        <EmptyState
          title="Failed to load analytics metrics"
          description="Could not connect to the analytics aggregator service."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : (
        <AnalyticsKpiCards data={data} />
      )}

      {/* Analytics Charts (6 Recharts charts) */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-base">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-base">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      ) : (
        <AnalyticsCharts data={data} />
      )}
    </div>
  );
}
