"use client";

import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { AuditDetailModal } from "./AuditDetailModal";
import type { AuditRecordItem } from "../../types/manager.types";

interface AuditLogTableProps {
  items: AuditRecordItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onSearchChange: (search: string) => void;
  onEntityChange: (entity: string) => void;
  onActionChange: (action: string) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  items,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearchChange,
  onEntityChange,
  onActionChange,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<AuditRecordItem | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVED")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (action.includes("REJECTED")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (action.includes("CREATED") || action.includes("SUBMITTED")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (action.includes("EVALUATION")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <>
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="relative w-72">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search user, entity ID, action..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md text-on-surface placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Entity Filter */}
            <select
              onChange={(e) => onEntityChange(e.target.value)}
              className="h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Entities</option>
              <option value="Quotation">Quotation</option>
              <option value="RuleEngine">Rule Engine</option>
              <option value="ApprovalWorkflow">Approval Workflow</option>
              <option value="DiscountPolicy">Discount Policy</option>
            </select>

            {/* Action Filter */}
            <select
              onChange={(e) => onActionChange(e.target.value)}
              className="h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Actions</option>
              <option value="QUOTATION_CREATED">Created</option>
              <option value="EVALUATION_COMPLETED">Evaluated</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="STATE_TRANSITION">State Transition</option>
            </select>
          </div>
        </div>

        {/* Audit Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-on-surface">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[11px] font-bold text-outline uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">User / Actor</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-5 py-3">Event Details</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{item.user.name}</span>
                        <span className="text-[10px] text-slate-400">{item.user.role}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {item.entity}
                        </span>
                        <span className="font-mono text-[11px] text-slate-600">
                          #{item.entityId}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(
                          item.action
                        )}`}
                      >
                        {item.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 text-xs truncate max-w-md">
                      {item.details}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(item)}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded transition-colors"
                        title="View Full Audit Record"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-outline bg-white">
          <div>
            Showing <strong className="text-on-surface">{items.length}</strong> of{" "}
            <strong className="text-on-surface">{totalCount}</strong> audit events
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 text-xs font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AuditDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </>
  );
};
