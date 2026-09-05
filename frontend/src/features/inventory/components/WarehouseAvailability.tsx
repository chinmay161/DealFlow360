import React from "react";
import { Building2, CheckCircle2, Sparkles } from "lucide-react";

export interface WarehouseStockEntry {
  warehouseId?: string;
  warehouseName: string;
  location?: string;
  available: number;
  reserved: number;
  freeStock: number;
  isBest?: boolean;
}

interface WarehouseAvailabilityProps {
  warehouses: WarehouseStockEntry[];
  requestedQuantity?: number;
  className?: string;
}

export const WarehouseAvailability: React.FC<WarehouseAvailabilityProps> = ({
  warehouses,
  requestedQuantity = 0,
  className = "",
}) => {
  if (!warehouses || warehouses.length === 0) {
    return (
      <div className={`p-3 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200 ${className}`}>
        No warehouse stock data available.
      </div>
    );
  }

  // Determine best fulfillment warehouse:
  // 1. First preference: highest freeStock >= requestedQuantity
  // 2. Fallback: highest freeStock overall
  const sorted = [...warehouses].sort((a, b) => b.freeStock - a.freeStock);
  const bestWarehouseName =
    sorted.find((w) => w.freeStock >= requestedQuantity)?.warehouseName ||
    sorted[0]?.warehouseName;

  return (
    <div className={`space-y-2 text-xs ${className}`}>
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Multi-Warehouse Regional Availability</span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono uppercase">
          {warehouses.length} Regional Hubs
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {warehouses.map((w) => {
          const isBest = w.isBest || w.warehouseName === bestWarehouseName;
          const canFulfill = requestedQuantity > 0 ? w.freeStock >= requestedQuantity : w.freeStock > 0;

          return (
            <div
              key={w.warehouseName}
              className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between ${
                isBest
                  ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/60 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {w.warehouseName}
                    {isBest && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                        <Sparkles className="w-2.5 h-2.5" />
                        Best Hub
                      </span>
                    )}
                  </span>
                  {w.location && (
                    <span className="text-[10px] text-slate-600 block">{w.location}</span>
                  )}
                </div>

                <span
                  className={`font-mono text-sm font-bold ${
                    canFulfill ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {w.freeStock}
                </span>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                <span>Avail: <strong className="text-slate-700 font-mono">{w.available}</strong></span>
                <span>•</span>
                <span>Rsvd: <strong className="text-slate-700 font-mono">{w.reserved}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {w.freeStock} Free
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
