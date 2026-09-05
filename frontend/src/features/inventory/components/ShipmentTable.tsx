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
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Truck,
  FileText,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { ShipmentRecord } from "../types/inventory.types";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import { TableSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import Link from "next/link";

interface ShipmentTableProps {
  shipments: ShipmentRecord[];
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
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: string) => void;
  onSelectShipment?: (shipment: ShipmentRecord) => void;
}

export const ShipmentTable: React.FC<ShipmentTableProps> = ({
  shipments,
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
  sortBy,
  sortOrder,
  onSortChange,
  onSelectShipment,
}) => {
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-600 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search consignment, quote, carrier, destination..."
            className="pl-9 h-9 text-xs rounded-lg border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={warehouseFilter}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Hubs</option>
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
            <option value="PLANNED">Planned</option>
            <option value="READY">Ready</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Dispatched</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : shipments.length === 0 ? (
        <EmptyState
          title="No Outbound Shipments Found"
          description="No consignment dispatches match your search or filter parameters."
          icon={Truck}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead
                  onClick={() => onSortChange("shipmentNumber")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center">
                    <span>Shipment Number</span>
                    {renderSortIcon("shipmentNumber")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => onSortChange("quotationNumber")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center">
                    <span>Quote Number</span>
                    {renderSortIcon("quotationNumber")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => onSortChange("warehouseName")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center">
                    <span>Warehouse</span>
                    {renderSortIcon("warehouseName")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => onSortChange("destination")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center">
                    <span>Destination</span>
                    {renderSortIcon("destination")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => onSortChange("carrier")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center">
                    <span>Carrier</span>
                    {renderSortIcon("carrier")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => onSortChange("estimatedDelivery")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center">
                    <span>Estimated Delivery</span>
                    {renderSortIcon("estimatedDelivery")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => onSortChange("status")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/70 select-none text-center"
                >
                  <div className="flex items-center justify-center">
                    <span>Current Status</span>
                    {renderSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((s) => (
                <TableRow
                  key={s.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectShipment?.(s)}
                >
                  <TableCell className="font-mono text-xs font-bold text-slate-900">
                    {s.shipmentNumber}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {s.quotationNumber ? (
                      <Link
                        href={`/quotations/${s.quotationNumber}`}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-700 hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{s.quotationNumber}</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">Order {s.orderNumber}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    <span className="font-mono text-[11px] text-blue-700 font-bold mr-1">
                      {s.warehouseCode}
                    </span>
                    <span>{s.warehouseName}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-800 font-medium">
                    {s.destination}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    <div className="font-semibold text-slate-900">{s.carrier}</div>
                    {s.trackingCode && (
                      <div className="font-mono text-[10px] text-slate-400">
                        {s.trackingCode}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    {s.estimatedDelivery || "Tomorrow by 4:00 PM"}
                  </TableCell>
                  <TableCell className="text-center">
                    <ShipmentStatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectShipment?.(s)}
                      className="h-7 px-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Track</span>
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
          Showing <span className="font-semibold text-slate-700">{shipments.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{total}</span> shipments
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
