"use client";

import React from "react";
import { MetricCard } from "../../components/MetricCard";
import {
  Clock,
  CheckCircle2,
  Wallet,
  Zap,
  ShieldAlert,
} from "lucide-react";
import type { ManagerDashboardKPIs } from "../../types/manager.types";

interface ManagerKpiGridProps {
  kpi?: ManagerDashboardKPIs;
}

export const ManagerKpiGrid: React.FC<ManagerKpiGridProps> = ({ kpi }) => {
  const pendingCount = kpi?.pendingApprovals ?? 7;
  const reviewedToday = kpi?.quotesReviewedToday ?? 14;
  const highRiskCount = kpi?.highRiskQuotations ?? 3;
  const totalValueStr = kpi?.formattedTotalValue ?? "₹1.48 Cr";
  const avgTime = kpi?.averageApprovalTimeHours ?? 3.4;
  const autoRate = kpi?.autoApprovalRate ?? 74.2;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-base">
      {/* 1. Pending Approvals */}
      <MetricCard
        title="Pending Approvals"
        value={pendingCount}
        icon={<Clock className="h-4 w-4" />}
        variant="warning"
        trend={{ value: "Active Queue", isNeutral: true }}
        footerLabel="Review Queue"
        footerValue={`${kpi?.pendingApprovalsUrgent ?? 2} urgent`}
        href="/manager/approvals"
      />

      {/* 2. Quotes Reviewed Today */}
      <MetricCard
        title="Quotes Reviewed Today"
        value={reviewedToday}
        icon={<CheckCircle2 className="h-4 w-4" />}
        variant="success"
        trend={{ value: "+18%", isPositive: true }}
        footerLabel="Throughput"
        footerValue="Exceeding SLA"
      />

      {/* 3. High-Risk Quotations */}
      <MetricCard
        title="High-Risk Quotations"
        value={highRiskCount}
        icon={<ShieldAlert className="h-4 w-4" />}
        variant="danger"
        trend={{ value: "Score ≥ 70", isPositive: false }}
        footerLabel="Escalation"
        footerValue="Mandatory L2"
        href="/manager/approvals?risk=HIGH"
      />

      {/* 4. Total Approval Value */}
      <MetricCard
        title="Total Approval Value"
        value={totalValueStr}
        icon={<Wallet className="h-4 w-4" />}
        variant="default"
        trend={{ value: "+12.8%", isPositive: true }}
        footerLabel="Pipeline at Risk"
        footerValue="7 Deals"
      />

      {/* 5. Average Approval Time */}
      <MetricCard
        title="Average Approval Time"
        value={`${avgTime} hrs`}
        icon={<Clock className="h-4 w-4" />}
        variant="info"
        trend={{ value: "-0.8h", isPositive: true }}
        footerLabel="Target SLA"
        footerValue="< 4.0 hrs"
      />

      {/* 6. Auto Approval Rate */}
      <MetricCard
        title="Auto Approval Rate"
        value={`${autoRate}%`}
        icon={<Zap className="h-4 w-4" />}
        variant="success"
        trend={{ value: "+3.4%", isPositive: true }}
        footerLabel="Rule Engine"
        footerValue="Fast-tracked"
      />
    </div>
  );
};
