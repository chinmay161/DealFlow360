import React from "react";
import { CheckCircle2, Clock, Truck } from "lucide-react";

interface ShipmentReadinessProps {
  isReady: boolean;
  estimatedDispatch?: string;
  reason?: string;
  className?: string;
}

export const ShipmentReadiness: React.FC<ShipmentReadinessProps> = ({
  isReady,
  estimatedDispatch = "Today",
  reason,
  className = "",
}) => {
  return (
    <div
      className={`p-3 rounded-lg border text-xs shadow-xs flex items-center justify-between gap-3 ${
        isReady
          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
          : "bg-amber-50/70 border-amber-200 text-amber-950"
      } ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            isReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {isReady ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs">Shipment Readiness:</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                isReady
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {isReady ? "Ready" : "Pending"}
            </span>
          </div>
          <p className="text-[11px] mt-0.5 opacity-90">
            {isReady ? (
              <span>✓ Inventory available in primary warehouse</span>
            ) : (
              <span>{reason || "Waiting for replenishment / backorder clearance"}</span>
            )}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
          Estimated Dispatch
        </span>
        <span className="font-semibold text-xs flex items-center justify-end gap-1 text-slate-900 mt-0.5">
          <Truck className="w-3.5 h-3.5 text-slate-600" />
          <span>{isReady ? estimatedDispatch : "3-5 Business Days"}</span>
        </span>
      </div>
    </div>
  );
};
