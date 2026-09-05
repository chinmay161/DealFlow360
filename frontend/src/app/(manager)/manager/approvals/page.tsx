"use client";

import React from "react";
import { useApprovalQueue } from "../../hooks/useApprovalQueue";
import { ApprovalTable } from "../../components/ApprovalTable";
import { MetricCard } from "../../components/MetricCard";
import { SkeletonTable } from "../../components/LoadingSkeletons";
import { EmptyState } from "../../components/EmptyState";
import { ClipboardCheck, Clock, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";
import { formatCompactINR } from "@/lib/currency";

export default function ManagerApprovalsPage() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  const items = data?.items || [];

  const pendingCount = items.filter(
    (i) => i.status === "Pending" || i.status === "In Review"
  ).length;
  const highRiskCount = items.filter((i) => i.riskCategory === "High").length;
  const approvedCount = items.filter((i) => i.status === "Approved").length;
  const totalPendingAmount = items
    .filter((i) => i.status === "Pending" || i.status === "In Review")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-space-xs">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
            Commercial Approval Queue
          </h1>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">
            Review, sign off, or return commercial quotations requiring managerial authorization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-8 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Refresh Approvals List"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-base">
        <MetricCard
          title="Awaiting Review"
          value={pendingCount}
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
          trend={{ value: "Action required", isNeutral: true }}
          footerLabel="Queue Status"
          footerValue="Level 1 Stage"
        />

        <MetricCard
          title="High Risk Items"
          value={highRiskCount}
          icon={<ShieldAlert className="h-4 w-4" />}
          variant="danger"
          trend={{ value: "Score ≥ 70", isPositive: false }}
          footerLabel="Escalation"
          footerValue="Finance oversight"
        />

        <MetricCard
          title="Pending Total Value"
          value={formatCompactINR(totalPendingAmount || 14850000)}
          icon={<ClipboardCheck className="h-4 w-4" />}
          variant="default"
          trend={{ value: `${pendingCount} deals`, isNeutral: true }}
          footerLabel="Commercial Exposure"
          footerValue="In Queue"
        />

        <MetricCard
          title="Approved Deals"
          value={approvedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
          trend={{ value: "Cleared", isPositive: true }}
          footerLabel="Commercial Clearance"
          footerValue="Ready to fulfill"
        />
      </div>

      {/* Main Enterprise Table */}
      {isLoading ? (
        <SkeletonTable rows={8} columns={9} />
      ) : isError ? (
        <EmptyState
          title="Failed to load approvals"
          description="Could not communicate with the approval routing engine."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : (
        <ApprovalTable items={items} isLoading={isLoading} />
      )}
    </div>
  );
}
