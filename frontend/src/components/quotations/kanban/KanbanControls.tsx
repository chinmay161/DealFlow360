"use client";

import React from "react";
import { Search, Filter, FilterX, ArrowUpDown } from "lucide-react";

export interface KanbanFilterState {
  search: string;
  status: string;
  salesRep: string;
  customerTier: string;
  warehouse: string;
  approvalLevel: string;
  riskLevel: string;
  sortBy: "createdAt" | "totalValue" | "riskScore" | "customerName" | "priority";
  sortOrder: "asc" | "desc";
}

interface KanbanControlsProps {
  filters: KanbanFilterState;
  onFilterChange: (key: keyof KanbanFilterState, value: any) => void;
  onResetFilters: () => void;
  salesReps: string[];
  totalMatches: number;
  totalQuotations: number;
}

export const KanbanControls: React.FC<KanbanControlsProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  salesReps,
  totalMatches,
  totalQuotations,
}) => {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== "ALL" ||
    filters.salesRep !== "ALL" ||
    filters.customerTier !== "ALL" ||
    filters.warehouse !== "ALL" ||
    filters.approvalLevel !== "ALL" ||
    filters.riskLevel !== "ALL";

  return (
    <div className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search quotations by quote #, account name, owner..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange("status", e.target.value)}
              aria-label="Filter quotations by status"
              className="h-9 pl-2.5 pr-7 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Sales Rep filter */}
          <div className="relative">
            <select
              value={filters.salesRep}
              onChange={(e) => onFilterChange("salesRep", e.target.value)}
              aria-label="Filter by assigned sales representative"
              className="h-9 pl-2.5 pr-7 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[150px]"
            >
              <option value="ALL">All Sales Reps</option>
              {salesReps.map((rep) => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Tier filter */}
          <div className="relative">
            <select
              value={filters.customerTier}
              onChange={(e) => onFilterChange("customerTier", e.target.value)}
              aria-label="Filter by customer commercial tier"
              className="h-9 pl-2.5 pr-7 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              <option value="PLATINUM">Platinum Tier</option>
              <option value="GOLD">Gold Tier</option>
              <option value="SILVER">Silver Tier</option>
              <option value="BRONZE">Bronze Tier</option>
            </select>
          </div>

          {/* Warehouse filter */}
          <div className="relative">
            <select
              value={filters.warehouse}
              onChange={(e) => onFilterChange("warehouse", e.target.value)}
              aria-label="Filter by regional warehouse fulfillment"
              className="h-9 pl-2.5 pr-7 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Warehouses</option>
              <option value="WH-BOM">Mumbai Hub (WH-BOM)</option>
              <option value="WH-BLR">Bengaluru Hub (WH-BLR)</option>
              <option value="WH-DEL">Delhi Hub (WH-DEL)</option>
            </select>
          </div>

          {/* Approval Level filter */}
          <div className="relative">
            <select
              value={filters.approvalLevel}
              onChange={(e) => onFilterChange("approvalLevel", e.target.value)}
              aria-label="Filter by required approval level"
              className="h-9 pl-2.5 pr-7 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Approval Levels</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="FINANCE_DIRECTOR">Finance Director</option>
              <option value="AUTO">Auto Approved</option>
            </select>
          </div>

          {/* Risk Level filter */}
          <div className="relative">
            <select
              value={filters.riskLevel}
              onChange={(e) => onFilterChange("riskLevel", e.target.value)}
              aria-label="Filter by commercial risk score"
              className="h-9 pl-2.5 pr-7 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Healthy (Low &lt; 40)</option>
              <option value="MEDIUM">Attention (Medium 40-69)</option>
              <option value="HIGH">High Risk (70-84)</option>
              <option value="CRITICAL">Critical (&ge; 85)</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange("sortBy", e.target.value)}
              aria-label="Sort cards by field"
              className="h-8 pl-2 pr-6 rounded-md bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer border-0"
            >
              <option value="createdAt">Created Date</option>
              <option value="totalValue">Deal Amount</option>
              <option value="riskScore">Risk Score</option>
              <option value="customerName">Customer Name</option>
              <option value="priority">Priority</option>
            </select>

            <button
              type="button"
              onClick={() => onFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
              className="h-7 w-7 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              title={`Sort ${filters.sortOrder === "asc" ? "Ascending" : "Descending"}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Counter sub-bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
        <span>
          Displaying <strong>{totalMatches}</strong> of <strong>{totalQuotations}</strong> quotations
        </span>
        {hasActiveFilters && (
          <span className="text-primary font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters active
          </span>
        )}
      </div>
    </div>
  );
};
