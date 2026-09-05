import React from "react";
import type { StockStatus } from "../types/inventory.types";

interface InventoryStatusBadgeProps {
  status: StockStatus;
  showIcon?: boolean;
}

export const InventoryStatusBadge: React.FC<InventoryStatusBadgeProps> = ({
  status,
  showIcon = true,
}) => {
  switch (status) {
    case "HEALTHY":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          <span>Healthy</span>
        </span>
      );
    case "LOW_STOCK":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          <span>Low Stock</span>
        </span>
      );
    case "OUT_OF_STOCK":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
          <span>Out of Stock</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span>{status}</span>
        </span>
      );
  }
};
