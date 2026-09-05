import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bookmark,
  Building2,
  Calendar,
  Clock,
  Package,
  FileText,
  User,
  ShieldCheck,
} from "lucide-react";
import type { ReservationRecord } from "../types/inventory.types";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ReservationDetailsModalProps {
  reservation: ReservationRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationDetailsModal: React.FC<ReservationDetailsModalProps> = ({
  reservation,
  isOpen,
  onClose,
}) => {
  if (!reservation) return null;

  const reservedDate =
    reservation.reservationDate ||
    new Date(reservation.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl">
        {/* Header Strip */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Reservation Details</span>
                  <ReservationStatusBadge status={reservation.status} />
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                ID: {reservation.id}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Linked Deal and Customer info */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{reservation.customerName || "Enterprise Client"}</span>
              </div>
              {reservation.quotationNumber && (
                <Link
                  href={`/quotations/${reservation.quotationNumber}`}
                  className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-700 hover:underline"
                >
                  <FileText className="w-3 h-3" />
                  <span>{reservation.quotationNumber}</span>
                </Link>
              )}
            </div>
          </div>

          {/* 3 Metric Summary Boxes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-blue-700">
                <Bookmark className="w-3 h-3" />
                <span>Reserved Quantity</span>
              </div>
              <div className="text-xl font-bold font-mono text-blue-900">
                {reservation.quantity.toLocaleString()} Units
              </div>
              <div className="text-[11px] text-slate-600 line-clamp-1">
                {reservation.productName}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                SKU: {reservation.sku}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-emerald-700">
                <Package className="w-3 h-3" />
                <span>Remaining Free Stock</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-900">
                {remainingStock.toLocaleString()} Units
              </div>
              <div className="text-[11px] text-slate-600">
                Unallocated at warehouse
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold">
                Buffer Level: Healthy
              </div>
            </div>
          </div>

          {/* Warehouse Hub Info */}
          <div className="p-3 rounded-xl border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Fulfillment Warehouse</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">
                {reservation.warehouseName}
              </span>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {reservation.warehouseCode}
              </span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Reservation Date</span>
              </div>
              <div className="font-mono text-slate-800 font-medium">
                {reservedDate}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Expiry Date</span>
              </div>
              <div className="font-mono text-amber-800 font-semibold">
                {expiryDate}
              </div>
            </div>
          </div>

          {/* Governance note */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/80 text-emerald-800 text-[11px] border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Stock locked via DealFlow360 Rule Engine. Read-only view for audit compliance.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          {reservation.quotationNumber && (
            <Link href={`/quotations/${reservation.quotationNumber}`}>
              <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
                Open Quotation
              </Button>
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
