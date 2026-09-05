"use client";

import React from "react";
import Link from "next/link";
import { useManagerDashboard } from "../../hooks/useManagerDashboard";
import { ManagerKpiGrid } from "../../features/dashboard/ManagerKpiGrid";
import { ApprovalTrendChart } from "../../features/dashboard/ApprovalTrendChart";
import { QuotationsStatusChart } from "../../features/dashboard/QuotationsStatusChart";
import { RiskDistributionChart } from "../../features/dashboard/RiskDistributionChart";
import { MonthlyRevenueChart } from "../../features/dashboard/MonthlyRevenueChart";
import { RuleFailureChart } from "../../features/dashboard/RuleFailureChart";
import { ApprovalCard } from "../../components/ApprovalCard";
import { SkeletonCard, SkeletonChart } from "../../components/LoadingSkeletons";
import { EmptyState } from "../../components/EmptyState";
import {
  Calendar,
  ChevronRight,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const { data, isLoading, isError, refetch } = useManagerDashboard();

  return (
    <div className="space-y-6">
      {/* Dashboard Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-space-xs">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
            Manager Command Center
          </h1>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">
            Real-time commercial governance, approval queue velocity, and portfolio exposure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-[#D1D5DB] text-xs text-slate-600 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">September 2026</span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="h-8 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Refresh Live Metrics"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Sync</span>
          </button>

          <Link
            href="/manager/approvals"
            className="h-8 px-3.5 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Approval Queue</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Metric Cards (6 cards) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-base">
          <SkeletonCard count={6} />
        </div>
      ) : isError ? (
        <EmptyState
          title="Unable to load KPI metrics"
          description="Could not connect to the commercial metrics engine."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : (
        <ManagerKpiGrid kpi={data?.kpi} />
      )}

      {/* Recharts Analytics Row 1: Approval Trend & Quotations by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-base items-start">
        <div className="lg:col-span-8">
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <ApprovalTrendChart data={data?.approvalTrend} />
          )}
        </div>

        <div className="lg:col-span-4">
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <QuotationsStatusChart data={data?.statusDistribution} />
          )}
        </div>
      </div>

      {/* Recharts Analytics Row 2: Risk Distribution, Monthly Revenue & Rule Failures */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-base items-start">
        <div className="lg:col-span-4">
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <RiskDistributionChart data={data?.riskDistribution} />
          )}
        </div>

        <div className="lg:col-span-4">
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <MonthlyRevenueChart data={data?.monthlyRevenue} />
          )}
        </div>

        <div className="lg:col-span-4">
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <RuleFailureChart data={data?.ruleFailures} />
          )}
        </div>
      </div>

      {/* Recent Approvals Queue Preview Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <h3 className="font-title-md text-sm font-bold text-on-surface">
              Pending Approvals Awaiting Review ({data?.recentPendingQueue?.length ?? 0})
            </h3>
          </div>

          <Link
            href="/manager/approvals"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View Complete Queue</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-base">
            <SkeletonCard count={3} />
          </div>
        ) : !data?.recentPendingQueue || data.recentPendingQueue.length === 0 ? (
          <EmptyState
            title="Approval Queue Cleared"
            description="All submitted quotations have been processed. No items currently require manager review."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-base">
            {data.recentPendingQueue.map((item) => (
              <ApprovalCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
