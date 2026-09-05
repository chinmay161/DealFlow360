import React from "react";
import { AlertTriangle, Info } from "lucide-react";

interface LowStockBannerProps {
  requestedQuantity: number;
  availableQuantity: number;
  freeStock?: number;
  className?: string;
  onViewAlternatives?: () => void;
}

export const LowStockBanner: React.FC<LowStockBannerProps> = ({
  requestedQuantity,
  availableQuantity,
  freeStock,
  className = "",
  onViewAlternatives,
}) => {
  const effectiveAvailable = freeStock !== undefined ? freeStock : availableQuantity;
  const isDeficit = requestedQuantity > effectiveAvailable;

  if (!isDeficit) return null;

  return (
    <div
      className={`p-3 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="flex items-center gap-3 font-semibold text-amber-950">
            <span>Requested Quantity: <strong className="font-mono">{requestedQuantity}</strong></span>
            <span>•</span>
            <span>Available Free Stock: <strong className="font-mono text-amber-700">{effectiveAvailable}</strong></span>
          </div>
          <p className="text-[11px] text-amber-800">
            ⚠ Only {effectiveAvailable} units are currently available for immediate dispatch.
            The quotation <strong>can still be submitted</strong>. Manager approval or split shipment may be required.
          </p>
        </div>
      </div>

      {onViewAlternatives && (
        <button
          type="button"
          onClick={onViewAlternatives}
          className="shrink-0 px-2.5 py-1 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
        >
          <Info className="w-3 h-3 text-amber-700" />
          <span>View Alternate Hubs</span>
        </button>
      )}
    </div>
  );
};
