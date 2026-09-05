import React from "react";
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
import { Search, ChevronLeft, ChevronRight, Bookmark, FileText } from "lucide-react";
import type { ReservationRecord, ReservationStatusType } from "../types/inventory.types";
import { TableSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import Link from "next/link";

interface ReservationCardProps {
  reservations: ReservationRecord[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  warehouseFilter: string;
  onWarehouseChange: (wh: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservations,
  isLoading = false,
  total = 0,
  page = 1,
  totalPages = 1,
  onPageChange,
  search,
  onSearchChange,
  warehouseFilter,
  onWarehouseChange,
  statusFilter,
  onStatusChange,
}) => {
  const getStatusBadge = (status: ReservationStatusType) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Confirmed Lock
          </span>
        );
      case "FULFILLED":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Fulfilled
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending Approval
          </span>
        );
      case "RELEASED":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Released
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Search & Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reservation, quote, customer..."
            className="pl-9 h-9 text-xs rounded-lg border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={warehouseFilter}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Warehouses</option>
            <option value="49c40fd3-bfae-4f7f-af29-23f7c468e8e7">Mumbai (WH-BOM)</option>
            <option value="35590b3a-2157-43d3-a029-3a9a59727245">Bengaluru (WH-BLR)</option>
            <option value="ba73ddc8-b58e-4a38-a920-ac34efe9d3dc">Delhi NCR (WH-DEL)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="PENDING">Pending</option>
            <option value="RELEASED">Released</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : reservations.length === 0 ? (
        <EmptyState
          title="No Reservations Found"
          description="No inventory allocations matching current query."
          icon={Bookmark}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-700">Reservation ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Quotation</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Customer Account</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Warehouse Hub</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Allocated Product</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Reserved Qty</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((res) => (
                <TableRow key={res.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    {res.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {res.quotationNumber ? (
                      <Link
                        href={`/quotations/${res.quotationNumber}`}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-700 hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{res.quotationNumber}</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">Direct Order</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">
                    {res.customerName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    <span className="font-mono text-[11px] text-blue-700 font-bold mr-1">
                      {res.warehouseCode}
                    </span>
                    <span>{res.warehouseName}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-xs text-slate-900">
                      {res.productName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {res.sku}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs text-blue-700">
                    {res.quantity.toLocaleString()} units
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(res.status)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {new Date(res.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
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
          Showing <span className="font-semibold text-slate-700">{reservations.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{total}</span> reservations
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
