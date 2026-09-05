import React from "react";
import { Bookmark, CheckCircle2 } from "lucide-react";

export interface ReservationStatusData {
  id?: string;
  quotationNumber?: string;
  warehouseName: string;
  status: "PENDING" | "RESERVED" | "FULFILLED" | "EXPIRED" | "CANCELLED";
  reservedQuantity: number;
  reservedAt?: string;
  expiresAt?: string;
  productName?: string;
}

interface ReservationStatusCardProps {
  data: ReservationStatusData;
  className?: string;
}

export const ReservationStatusCard: React.FC<ReservationStatusCardProps> = ({
  data,
  className = "",
}) => {
  const {
    warehouseName,
    status,
    reservedQuantity,
    reservedAt,
    expiresAt,
  } = data;

  const isReserved = status === "RESERVED" || status === "FULFILLED";

  return (
    <div
      className={`p-3.5 rounded-lg border text-xs shadow-xs transition-all bg-white border-slate-200 hover:border-slate-300 ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Bookmark className="w-4 h-4 text-primary" />
          <span>Quotation Inventory Reservation</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isReserved
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : status === "PENDING"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2.5 text-center">
        <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">Warehouse</span>
          <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate" title={warehouseName}>
            {warehouseName}
          </span>
        </div>

        <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">Reserved Qty</span>
          <span className="font-mono font-bold text-primary text-xs mt-0.5 block">
            {reservedQuantity} Units
          </span>
        </div>

        <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">Status</span>
          <span className="font-semibold text-emerald-700 text-xs mt-0.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Active</span>
          </span>
        </div>
      </div>

      {(reservedAt || expiresAt) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span>Reserved: {reservedAt || "Upon submission"}</span>
          <span>Expires: {expiresAt || "In 7 days"}</span>
        </div>
      )}
    </div>
  );
};
