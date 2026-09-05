"use client";

import React from "react";
import { MetricCard } from "@/components/MetricCard";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Hourglass,
} from "lucide-react";
import type { DashboardKpis } from "@/types/dashboard.types";
import { MetricCardSkeleton } from "@/components/LoadingSkeleton";

interface KpiSectionProps {
  kpis?: DashboardKpis;
  isLoading?: boolean;
}

export function KpiSection({ kpis, isLoading = false }: KpiSectionProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Active Quotations */}
      <MetricCard
        title="Active Quotations"
        value={kpis.activeQuotations}
        subtitle="In pipeline"
        icon={FileText}
        trend={{ value: "+3 this week", positive: true }}
        accentColor="blue"
      />

      {/* 2. Pending Approval */}
      <MetricCard
        title="Pending Approval"
        value={kpis.pendingApproval}
        subtitle="Awaiting review"
        icon={Clock}
        trend={{ value: "4 urgent", positive: false }}
        accentColor="amber"
      />

      {/* 3. Approved Quotations */}
      <MetricCard
        title="Approved Deals"
        value={kpis.approvedQuotations}
        subtitle="Cleared quotes"
        icon={CheckCircle2}
        trend={{ value: "+22%", positive: true }}
        accentColor="emerald"
      />

      {/* 4. Rejected Quotations */}
      <MetricCard
        title="Rejected Quotes"
        value={kpis.rejectedQuotations}
        subtitle="Over discount cap"
        icon={XCircle}
        trend={{ value: "-8% MoM", positive: true }}
        accentColor="rose"
      />

      {/* 5. Monthly Revenue */}
      <MetricCard
        title="Monthly Revenue"
        value={`₹${(kpis.monthlyRevenue / 100000).toFixed(1)}L`}
        subtitle="Approved deal value"
        icon={IndianRupee}
        trend={{ value: `+${kpis.revenueGrowthPercent}%`, positive: true }}
        accentColor="purple"
      />

      {/* 6. Average Approval Time */}
      <MetricCard
        title="Avg. Approval Time"
        value={`${kpis.averageApprovalTimeHours}h`}
        subtitle="Submission to sign-off"
        icon={Hourglass}
        trend={{ value: "1.2h faster", positive: true }}
        accentColor="indigo"
      />
    </div>
  );
}
