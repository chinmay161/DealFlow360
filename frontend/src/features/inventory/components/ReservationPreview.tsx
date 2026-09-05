import React from "react";
import { BookmarkCheck, AlertCircle } from "lucide-react";

interface ReservationPreviewProps {
  warehouseName: string;
  willReserve: number;
  currentAvailable: number;
  currentReserved?: number;
  className?: string;
}

export const ReservationPreview: React.FC<ReservationPreviewProps> = ({
  warehouseName,
  willReserve,
  currentAvailable,
  currentReserved = 0,
  className = "",
}) => {
  const currentFree = Math.max(0, currentAvailable - currentReserved);
  const remainingStock = Math.max(0, currentFree - willReserve);
  const isDeficit = willReserve > currentFree;

  return (
    <div
      className={`p-3 rounded-lg border text-xs shadow-xs ${
        isDeficit
          ? "bg-rose-50/70 border-rose-200 text-rose-950"
          : "bg-blue-50/50 border-blue-200/80 text-blue-950"
      } ${className}`}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-black/5 mb-2">
        <div className="flex items-center gap-1.5 font-bold">
          <BookmarkCheck className={`w-3.5 h-3.5 ${isDeficit ? "text-rose-600" : "text-primary"}`} />
          <span>Reservation Preview</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
          Pre-Submission Allocation
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
        <div className="p-1.5 rounded bg-white/80 border border-black/5">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Warehouse</span>
          <span className="font-semibold text-slate-800 text-[11px] truncate block" title={warehouseName}>
            {warehouseName}
          </span>
        </div>

        <div className="p-1.5 rounded bg-white/80 border border-black/5">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Will Reserve</span>
          <span className="font-mono font-bold text-primary text-xs">
            {willReserve.toLocaleString()} Units
          </span>
        </div>

        <div className="p-1.5 rounded bg-white/80 border border-black/5">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Remaining Stock</span>
          <span
            className={`font-mono font-bold text-xs ${
              isDeficit ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            {remainingStock.toLocaleString()}
          </span>
        </div>
      </div>

      {isDeficit && (
        <div className="mt-2 text-[11px] text-rose-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>Notice: Reservation quantity exceeds current free stock ({currentFree} units).</span>
        </div>
      )}
    </div>
  );
};
