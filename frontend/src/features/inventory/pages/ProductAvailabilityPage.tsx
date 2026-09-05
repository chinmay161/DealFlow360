"use client";

import React, { useState } from "react";
import { Package, Download, RefreshCw } from "lucide-react";
import { InventoryTable } from "../components/InventoryTable";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { InventoryExportModal } from "../components/InventoryExportModal";
import { useInventoryItems } from "../hooks/useInventoryData";
import { Button } from "@/components/ui/button";
import type { InventoryFilterParams } from "../types/inventory.types";

export const ProductAvailabilityPage: React.FC = () => {
  const [filters, setFilters] = useState<InventoryFilterParams>({
    search: "",
    category: "ALL",
    warehouse: "ALL",
    status: "ALL",
    page: 1,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { data, isLoading, refetch } = useInventoryItems(filters);

  const handleFilterChange = (newFilters: Partial<InventoryFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const items = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Product Stock Availability &amp; Free Stock Catalog
            </h2>
            <p className="text-xs text-slate-500">
              Real-time multi-warehouse inventory levels, committed reservations, and unallocated free stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs font-semibold gap-1.5 border-slate-200 text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Catalog</span>
          </Button>
        </div>
      </div>

      {/* Enterprise Inventory Table */}
      <InventoryTable
        items={items}
        isLoading={isLoading}
        total={total}
        page={filters.page || 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSelectProduct={(item) => setSelectedProductId(item.sku)}
      />

      {/* Deep-Dive Product Detail Modal */}
      <ProductDetailModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />

      {/* Export Modal */}
      <InventoryExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        items={items}
      />
    </div>
  );
};
