"use client";

import React, { useState } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { AuditLogTable } from "../../features/audit/AuditLogTable";
import { SkeletonTable } from "../../components/LoadingSkeletons";
import { EmptyState } from "../../components/EmptyState";
import { ShieldCheck, RefreshCw } from "lucide-react";

export default function ManagerAuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("ALL");
  const [action, setAction] = useState("ALL");

  const { data, isLoading, isError, refetch } = useAuditLogs({
    page,
    pageSize: 12,
    search,
    entity,
    action,
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-space-xs">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
            Commercial Audit Logs
          </h1>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">
            Cryptographically verifiable, append-only records of quotation decisions, policy evaluations, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-[#D1D5DB] text-xs text-slate-600 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium">Append-Only Immutable Ledger</span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="h-8 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Refresh Audit Logs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <SkeletonTable rows={10} columns={6} />
      ) : isError ? (
        <EmptyState
          title="Unable to load audit logs"
          description="Could not query the centralized audit service."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : (
        <AuditLogTable
          items={data?.items || []}
          totalCount={data?.total || 0}
          page={page}
          pageSize={12}
          onPageChange={(p) => setPage(p)}
          onSearchChange={(s) => {
            setSearch(s);
            setPage(1);
          }}
          onEntityChange={(e) => {
            setEntity(e);
            setPage(1);
          }}
          onActionChange={(a) => {
            setAction(a);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
