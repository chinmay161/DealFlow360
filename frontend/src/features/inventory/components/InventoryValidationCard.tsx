import React from "react";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export interface InventoryValidationProps {
  passed: boolean;
  statusText?: string;
  reason?: string;
  approvalImpact?: string;
  requestedQuantity?: number;
  availableQuantity?: number;
  ruleName?: string;
  className?: string;
}

export const InventoryValidationCard: React.FC<InventoryValidationProps> = ({
  passed,
  statusText,
  reason,
  approvalImpact,
  requestedQuantity,
  availableQuantity,
  ruleName = "Inventory Availability Rule",
  className = "",
}) => {
  return (
    <div
      className={`p-4 rounded-lg border text-xs shadow-xs transition-all ${
        passed
          ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
          : "bg-rose-50/70 border-rose-200 text-rose-950"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {passed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs">Inventory Validation</h4>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  passed
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                {statusText || (passed ? "PASSED" : "FAILED")}
              </span>
            </div>
            <p className="text-[11px] font-medium opacity-90">
              {reason || (passed ? "Sufficient inventory available." : "Requested quantity exceeds available inventory.")}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0">
          Rule Engine
        </span>
      </div>

      {!passed && (
        <div className="mt-3 pt-2.5 border-t border-rose-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white/80 p-2 rounded border border-rose-100">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Reason</span>
            <span className="text-rose-900 font-medium mt-0.5 block">
              {reason || "Requested quantity exceeds available inventory."}
            </span>
          </div>

          <div className="bg-white/80 p-2 rounded border border-rose-100">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Approval Impact</span>
            <span className="text-amber-800 font-bold mt-0.5 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
              <span>{approvalImpact || "Manager Approval Required."}</span>
            </span>
          </div>
        </div>
      )}

      {(requestedQuantity !== undefined && availableQuantity !== undefined) && (
        <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-mono text-slate-600">
          <span>Requested: <strong>{requestedQuantity}</strong></span>
          <span>Available Free Stock: <strong>{availableQuantity}</strong></span>
          <span>Rule: <strong>{ruleName}</strong></span>
        </div>
      )}
    </div>
  );
};
