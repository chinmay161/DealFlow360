"use client";

import React from "react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { KpiSection } from "@/features/dashboard/KpiSection";
import { QuickActions } from "@/features/dashboard/QuickActions";
import { ChartsSection } from "@/features/dashboard/ChartsSection";
import { ActivityTimeline } from "@/features/dashboard/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function CustomerDashboardPage() {
  const { data, isLoading, refetch, isRefetching } = useDashboardMetrics();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Commercial Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track quotation lifecycles, rule evaluations, approval routing, and revenue performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/customer/quotations/new">
            <Button variant="primary" size="sm" className="text-xs h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              New Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActions />

      {/* 6 KPI Metric Cards */}
      <KpiSection kpis={data?.kpi} isLoading={isLoading} />

      {/* 3 Interactive Recharts */}
      <ChartsSection
        statusDistribution={data?.statusDistribution}
        monthlyQuotations={data?.monthlyQuotations}
        revenueTrend={data?.revenueTrend}
        isLoading={isLoading}
      />

      {/* Recent Lifecycle Activity Timeline */}
      <ActivityTimeline activities={data?.recentActivity} />
    </div>
  );
}
