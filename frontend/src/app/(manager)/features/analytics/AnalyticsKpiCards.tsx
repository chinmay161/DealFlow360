"use client";

import React from "react";
import { MetricCard } from "../../components/MetricCard";
import { CheckCircle2, ShieldAlert, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCompactINR } from "@/lib/currency";
import type { ManagerAnalyticsData } from "../../types/manager.types";

interface AnalyticsKpiCardsProps {
  data?: ManagerAnalyticsData;
}

export const AnalyticsKpiCards: React.FC<AnalyticsKpiCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-base">
      <MetricCard
        title="Approval Rate"
        value={`${data?.approvalRate ?? 88.5}%`}
        icon={<CheckCircle2 className="h-4 w-4" />}
        variant="success"
        trend={{ value: "+2.1%", isPositive: true }}
        footerLabel="Efficiency"
        footerValue="High Clearance"
      />

      <MetricCard
        title="Average Risk Score"
        value={`${data?.averageRisk ?? 48}/100`}
        icon={<ShieldAlert className="h-4 w-4" />}
        variant="info"
        trend={{ value: "-4 pts", isPositive: true }}
        footerLabel="Portfolio Health"
        footerValue="Moderate"
      />

      <MetricCard
        title="Auto Approval %"
        value={`${data?.autoApprovalRate ?? 74.2}%`}
        icon={<Zap className="h-4 w-4" />}
        variant="success"
        trend={{ value: "+5.4%", isPositive: true }}
        footerLabel="Automation"
        footerValue="Rule Engine"
      />

      <MetricCard
        title="Total Approved Revenue"
        value={formatCompactINR(data?.totalApprovedRevenue ?? 38400000)}
        icon={<ArrowUpRight className="h-4 w-4" />}
        variant="default"
        trend={{ value: "+14.2%", isPositive: true }}
        footerLabel="Cleared Deals"
        footerValue="Ready to fulfill"
      />

      <MetricCard
        title="Total Rejected Revenue"
        value={formatCompactINR(data?.totalRejectedRevenue ?? 3200000)}
        icon={<ArrowDownRight className="h-4 w-4" />}
        variant="danger"
        trend={{ value: "-8.1%", isPositive: true }}
        footerLabel="Prevented Losses"
        footerValue="Margin Guard"
      />
    </div>
  );
};
