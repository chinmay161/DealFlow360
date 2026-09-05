"use client";

import React, { useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import { InventoryTrendChart } from "../components/InventoryTrendChart";
import { useInventoryTrends } from "../hooks/useInventoryTrends";
import { Button } from "@/components/ui/button";
import { ChartSkeleton } from "../components/LoadingSkeleton";

export const InventoryTrendsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState("30D");
  const { data, isLoading, refetch } = useInventoryTrends(timeRange);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Inventory Trends &amp; Telemetry Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Multi-dimensional historical and forward telemetry for stock movement, reservation surges, and consignment turnaround
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            {["7D", "30D", "90D"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timeRange === range
                    ? "bg-white text-blue-700 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs font-semibold gap-1.5 border-slate-200 text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Multi-Tab Trend Chart */}
      {isLoading ? (
        <ChartSkeleton height="h-80" />
      ) : (
        <InventoryTrendChart data={data} isLoading={isLoading} />
      )}
    </div>
  );
};
