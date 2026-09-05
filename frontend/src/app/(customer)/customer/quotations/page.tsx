"use client";

import React, { useState } from "react";
import { useQuotations } from "@/hooks/useQuotations";
import { QuotationFilters } from "@/features/quotations/QuotationFilters";
import { QuotationTable } from "@/features/quotations/QuotationTable";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { QuotationFilterParams } from "@/types/quotation.types";

export default function QuotationsPage() {
  const [filters, setFilters] = useState<QuotationFilterParams>({
    page: 1,
    pageSize: 10,
    status: "ALL",
    riskLevel: "ALL",
    sortBy: "date",
    sortOrder: "desc",
  });

  const { data, isLoading, refetch, isRefetching } = useQuotations(filters);

  const handleFilterChange = (updates: Partial<QuotationFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleSort = (key: string) => {
    setFilters((prev) => {
      const isSameKey = prev.sortBy === key;
      const nextOrder = isSameKey && prev.sortOrder === "asc" ? "desc" : "asc";
      return {
        ...prev,
        sortBy: key as any,
        sortOrder: nextOrder,
        page: 1,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Commercial Quotations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, monitor governance exceptions, and track multi-stage approval statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/customer/quotations/new">
            <Button variant="primary" size="sm" className="text-xs h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              New Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters (Status chips, Search, Risk filter) */}
      <QuotationFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Table */}
      <QuotationTable
        quotations={data?.quotations || []}
        isLoading={isLoading}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
        onRefresh={() => refetch()}
      />

      {/* Pagination */}
      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalItems={data.total}
          pageSize={data.pageSize}
          onPageChange={(page) => handleFilterChange({ page })}
        />
      )}
    </div>
  );
}
