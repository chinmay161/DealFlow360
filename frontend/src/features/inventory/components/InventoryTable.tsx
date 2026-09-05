import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
} from "lucide-react";
import { InventoryStatusBadge } from "./InventoryStatusBadge";
import { TableSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import type { InventoryItem, InventoryFilterParams } from "../types/inventory.types";
import { exportInventoryToCSV } from "../services/export.service";

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  filters: InventoryFilterParams;
  onFilterChange: (filters: Partial<InventoryFilterParams>) => void;
  onSelectProduct?: (product: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  isLoading = false,
  total = 0,
  page = 1,
  totalPages = 1,
  onPageChange,
  filters,
  onFilterChange,
  onSelectProduct,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchInput, page: 1 });
  };

  const handleSort = (column: string) => {
    const isCurrent = filters.sortBy === column;
    const nextOrder = isCurrent && filters.sortOrder === "asc" ? "desc" : "asc";
    onFilterChange({ sortBy: column, sortOrder: nextOrder });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    onFilterChange({
      search: "",
      category: "ALL",
      warehouse: "ALL",
      status: "ALL",
      page: 1,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Top Filter & Action Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search SKU, product, warehouse..."
            className="pl-9 h-9 text-xs rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
          />
        </form>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={filters.category || "ALL"}
            onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Categories</option>
            <option value="cf2bdac3-1ee5-4345-a7b0-8641fab8721d">Enterprise Hardware</option>
            <option value="51013637-70f2-4049-87ba-1a25d8d02b97">Mobile Workstations</option>
            <option value="4e186bc8-6e33-4d09-89bf-7659a1c52da7">Displays & Peripherals</option>
            <option value="887d111e-fc82-4c6b-abe0-ca039f63e195">Docking & Power</option>
          </select>

          {/* Warehouse Filter */}
          <select
            value={filters.warehouse || "ALL"}
            onChange={(e) => onFilterChange({ warehouse: e.target.value, page: 1 })}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Warehouses</option>
            <option value="49c40fd3-bfae-4f7f-af29-23f7c468e8e7">WH-BOM (Mumbai)</option>
            <option value="35590b3a-2157-43d3-a029-3a9a59727245">WH-BLR (Bengaluru)</option>
            <option value="ba73ddc8-b58e-4a38-a920-ac34efe9d3dc">WH-DEL (Delhi NCR)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || "ALL"}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">🟢 Healthy Stock</option>
            <option value="LOW_STOCK">🟡 Low Stock</option>
            <option value="OUT_OF_STOCK">🔴 Out of Stock</option>
          </select>

          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportInventoryToCSV(items)}
            className="h-9 text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : items.length === 0 ? (
        <EmptyState onAction={handleResetFilters} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead
                  onClick={() => handleSort("sku")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("name")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Product Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Category</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Warehouse</TableHead>
                <TableHead
                  onClick={() => handleSort("quantityAvailable")}
                  className="text-xs font-semibold text-slate-700 text-right cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Available</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("quantityReserved")}
                  className="text-xs font-semibold text-slate-700 text-right cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Reserved</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("freeStock")}
                  className="text-xs font-semibold text-slate-700 text-right cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Free Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  onClick={() => onSelectProduct?.(item)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-blue-700">
                    {item.sku}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-xs text-slate-900 line-clamp-1">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {item.categoryName}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>{item.warehouseName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({item.warehouseCode})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-slate-900 text-right">
                    {item.quantityAvailable.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600 text-right">
                    {item.quantityReserved.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-emerald-700 text-right">
                    {item.freeStock.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <InventoryStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectProduct?.(item)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      title="Inspect Product Availability"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Showing <span className="font-semibold text-slate-700">{items.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{total}</span> inventory items
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
            className="h-8 px-2.5 text-xs font-semibold border-slate-200 text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          <span className="text-xs font-medium px-2 text-slate-700">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
            className="h-8 px-2.5 text-xs font-semibold border-slate-200 text-slate-600 disabled:opacity-40"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
