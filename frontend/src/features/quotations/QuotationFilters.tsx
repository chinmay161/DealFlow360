"use client";

import React from "react";
import { SearchBar } from "@/components/SearchBar";
import type { QuotationFilterParams, QuotationStatus } from "@/types/quotation.types";
import { Filter } from "lucide-react";

interface QuotationFiltersProps {
  filters: QuotationFilterParams;
  onFilterChange: (newFilters: Partial<QuotationFilterParams>) => void;
}

export function QuotationFilters({ filters, onFilterChange }: QuotationFiltersProps) {
  const statusTabs: Array<{ label: string; value: QuotationStatus | "ALL" }> = [
    { label: "All Quotes", value: "ALL" },
    { label: "Drafts", value: "DRAFT" },
    { label: "In Review", value: "IN_REVIEW" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="space-y-3">
      {/* Status Chips Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => {
          const isActive = (filters.status || "ALL") === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onFilterChange({ status: tab.value, page: 1 })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={filters.search || ""}
          onChange={(search) => onFilterChange({ search, page: 1 })}
          placeholder="Search by quote number or customer..."
          className="max-w-md"
        />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Risk:</span>
          </div>

          <select
            value={filters.riskLevel || "ALL"}
            onChange={(e) => onFilterChange({ riskLevel: e.target.value as any, page: 1 })}
            className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk (≤30)</option>
            <option value="MEDIUM">Medium Risk (31-70)</option>
            <option value="HIGH">High Risk (&gt;70)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
