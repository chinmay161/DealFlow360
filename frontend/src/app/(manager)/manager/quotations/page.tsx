"use client";

import React from "react";
import { useApprovalQueue } from "../../hooks/useApprovalQueue";
import { ApprovalTable } from "../../components/ApprovalTable";
import { SkeletonTable } from "../../components/LoadingSkeletons";
import { EmptyState } from "../../components/EmptyState";
import { RefreshCw } from "lucide-react";

export default function ManagerQuotationsPage() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  const items = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-space-xs">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
            Commercial Quotations Directory
          </h1>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">
            Monitor and review all active quotations, customer tiers, and commercial margins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-8 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} columns={9} />
      ) : isError ? (
        <EmptyState
          title="Unable to load quotations"
          description="Could not connect to the quotation service."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : (
        <ApprovalTable items={items} isLoading={isLoading} />
      )}
    </div>
  );
}
