"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { RiskBadge } from "./RiskBadge";
import { ApprovalBadge } from "./ApprovalBadge";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import type { ApprovalItem } from "../types/manager.types";
import { useApprovalMutations } from "../hooks/useApprovalMutations";

interface ApprovalTableProps {
  items: ApprovalItem[];
  isLoading?: boolean;
}

export const ApprovalTable: React.FC<ApprovalTableProps> = ({ items }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"submittedAt" | "amount" | "riskScore" | "quotationNumber">(
    "submittedAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { approveMutation } = useApprovalMutations();

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.salesExecutive.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk =
        riskFilter === "ALL" || item.riskCategory.toUpperCase() === riskFilter.toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" || item.status.toUpperCase() === statusFilter.toUpperCase();

      const matchesPriority =
        priorityFilter === "ALL" || item.priority.toUpperCase() === priorityFilter.toUpperCase();

      return matchesSearch && matchesRisk && matchesStatus && matchesPriority;
    });
  }, [items, searchTerm, riskFilter, statusFilter, priorityFilter]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "riskScore") {
        comparison = a.riskScore - b.riskScore;
      } else if (sortBy === "quotationNumber") {
        comparison = a.quotationNumber.localeCompare(b.quotationNumber);
      } else {
        comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredItems, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((i) => i.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = async () => {
    for (const id of selectedIds) {
      await approveMutation.mutateAsync({ approvalId: id, comments: "Batch approved by Manager" });
    }
    setSelectedIds([]);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Controls Bar: Search & Filters */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 bg-white">
        {/* Search input */}
        <div className="relative w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search quote, customer, sales rep..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md text-on-surface placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk (≥ 70)</option>
            <option value="MEDIUM">Medium Risk (40-69)</option>
            <option value="LOW">Low Risk (&lt; 40)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CHANGES REQUESTED">Changes Requested</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-600 focus:outline-none"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Batch Actions Bar (when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/5 px-4 py-2 border-b border-primary/20 flex items-center justify-between animate-in fade-in duration-150">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.length} quotations selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchApprove}
              disabled={approveMutation.isPending}
              className="h-7 px-3 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              <span>Approve Selected</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-800 rounded border border-slate-300 bg-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Enterprise Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-on-surface">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[11px] font-bold text-outline uppercase tracking-wider">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedItems.length > 0 &&
                    selectedIds.length === paginatedItems.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
              </th>

              <th
                onClick={() => handleSort("quotationNumber")}
                className="px-4 py-3 cursor-pointer hover:text-on-surface transition-colors select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Quote #</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Sales Executive</th>

              <th
                onClick={() => handleSort("amount")}
                className="px-4 py-3 cursor-pointer hover:text-on-surface transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Amount</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort("riskScore")}
                className="px-4 py-3 cursor-pointer hover:text-on-surface transition-colors select-none text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th className="px-4 py-3 text-center">Stage Level</th>

              <th
                onClick={() => handleSort("submittedAt")}
                className="px-4 py-3 cursor-pointer hover:text-on-surface transition-colors select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Submitted</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E5E7EB]">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                  No quotations match your filters.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </td>

                    {/* Quote Number */}
                    <td className="px-4 py-3.5 font-bold">
                      <Link
                        href={`/manager/quotation/${item.quotationNumber}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <span>#{item.quotationNumber}</span>
                        {item.priority === "High" && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-rose-500"
                            title="High Priority"
                          ></span>
                        )}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface truncate max-w-[180px]">
                          {item.customer}
                        </span>
                        <span className="text-[10px] text-outline font-medium">
                          Tier: {item.customerTier}
                        </span>
                      </div>
                    </td>

                    {/* Sales Executive */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {item.salesExecutive.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700 truncate max-w-[130px]">
                          {item.salesExecutive.name}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-right font-bold text-on-surface tnum">
                      {item.formattedAmount}
                    </td>

                    {/* Risk Badge */}
                    <td className="px-4 py-3.5 text-center">
                      <RiskBadge
                        score={item.riskScore}
                        category={item.riskCategory}
                        size="sm"
                      />
                    </td>

                    {/* Approval Level */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.approvalLevel}
                      </span>
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {item.submittedTimeAgo}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <ApprovalBadge status={item.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/manager/quotation/${item.quotationNumber}`}
                          className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[11px] transition-colors"
                        >
                          Review
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-outline bg-white">
        <div>
          Showing{" "}
          <strong className="text-on-surface font-semibold">
            {sortedItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-on-surface font-semibold">
            {Math.min(currentPage * pageSize, sortedItems.length)}
          </strong>{" "}
          of <strong className="text-on-surface font-semibold">{sortedItems.length}</strong> quotes
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 py-0.5 text-xs font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
