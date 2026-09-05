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
import { Search, ChevronLeft, ChevronRight, Bookmark, FileText, Eye } from "lucide-react";
import type { ReservationRecord } from "../types/inventory.types";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { TableSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import Link from "next/link";

interface ReservationTableProps {
  reservations: ReservationRecord[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  warehouseFilter: string;
  onWarehouseChange: (warehouse: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onSelectReservation?: (reservation: ReservationRecord) => void;
}

export const ReservationTable: React.FC<ReservationTableProps> = ({
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
  onSelectReservation,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reservation ID, quote, customer, SKU..."
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
            <option value="RESERVED">Reserved</option>
            <option value="RELEASED">Released</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : reservations.length === 0 ? (
        <EmptyState
          title="No Reservations Found"
          description="No inventory allocations matching your search or filter parameters."
          icon={Bookmark}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-700">Reservation ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Quote Number</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Customer</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Warehouse</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Reserved Quantity</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Reserved Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((res) => {
                const dateString =
                  res.reservationDate ||
                  new Date(res.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                return (
                  <TableRow
                    key={res.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectReservation?.(res)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">
                      {res.id.slice(0, 10)}...
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                    <TableCell className="text-right font-mono font-bold text-xs text-blue-700">
                      {res.quantity.toLocaleString()} units
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {dateString}
                    </TableCell>
                    <TableCell className="text-center">
                      <ReservationStatusBadge status={res.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectReservation?.(res)}
                        className="h-7 px-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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
