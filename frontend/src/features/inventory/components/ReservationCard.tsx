import React from "react";
import { Card } from "@/components/ui/card";
import { Bookmark, Building2, Calendar, Clock, Package, FileText, ArrowRight } from "lucide-react";
import type { ReservationRecord } from "../types/inventory.types";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import Link from "next/link";

interface ReservationCardProps {
  reservation: ReservationRecord;
  onViewDetails?: (reservation: ReservationRecord) => void;
  className?: string;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onViewDetails,
  className = "",
}) => {
  const reservedDate =
    reservation.reservationDate ||
    new Date(reservation.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const expiryDate =
    reservation.expiryDate ||
    new Date(new Date(reservation.createdAt).getTime() + 7 * 24 * 3600 * 1000).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  const remainingStock = reservation.remainingInventory ?? 45;

  return (
    <Card
      className={`p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-3.5 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900">
                {reservation.id.slice(0, 10)}...
              </span>
              <ReservationStatusBadge status={reservation.status} />
            </div>
            {reservation.customerName && (
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {reservation.customerName}
              </p>
            )}
          </div>
        </div>

        {reservation.quotationNumber && (
          <Link
            href={`/quotations/${reservation.quotationNumber}`}
            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-700 hover:underline bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100"
          >
            <FileText className="w-3 h-3" />
            <span>{reservation.quotationNumber}</span>
          </Link>
        )}
      </div>

      {/* Main Reservation Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs">
        {/* Warehouse */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span>Warehouse</span>
          </div>
          <div className="font-semibold text-slate-800 line-clamp-1">
            {reservation.warehouseName}
          </div>
          <div className="font-mono text-[10px] text-blue-700">
            {reservation.warehouseCode}
          </div>
        </div>

        {/* Reserved Quantity */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <Bookmark className="w-3 h-3 text-blue-600" />
            <span>Reserved Quantity</span>
          </div>
          <div className="font-mono font-bold text-sm text-blue-700">
            {reservation.quantity.toLocaleString()} Units
          </div>
          <div className="text-[10px] text-slate-500 line-clamp-1">
            {reservation.productName}
          </div>
        </div>

        {/* Remaining Inventory */}
        <div className="space-y-0.5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <Package className="w-3 h-3 text-emerald-600" />
            <span>Remaining Inventory</span>
          </div>
          <div className="font-mono font-bold text-sm text-emerald-700">
            {remainingStock.toLocaleString()} Units
          </div>
          <div className="text-[10px] text-slate-400">Unallocated Stock</div>
        </div>
      </div>

      {/* Reservation & Expiry Dates */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Reserved: <strong className="text-slate-700 font-mono">{reservedDate}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Expires: <strong className="text-slate-700 font-mono">{expiryDate}</strong></span>
          </div>
        </div>

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(reservation)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 self-start sm:self-center"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </Card>
  );
};
