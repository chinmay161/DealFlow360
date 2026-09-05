import React from "react";
import { Building2, Clock } from "lucide-react";
import { StockIndicator } from "./StockIndicator";

export interface InventoryAvailabilityData {
  warehouseName: string;
  warehouseCode?: string;
  availableStock: number;
  reservedStock: number;
  freeStock: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  lastUpdated?: string;
  productName?: string;
  sku?: string;
}

interface InventoryAvailabilityCardProps {
  data: InventoryAvailabilityData;
  className?: string;
  compact?: boolean;
}

export const InventoryAvailabilityCard: React.FC<InventoryAvailabilityCardProps> = ({
  data,
  className = "",
  compact = false,
}) => {
  const {
    warehouseName,
    warehouseCode,
    availableStock,
    reservedStock,
    freeStock,
    lastUpdated = "Just now",
    productName,
    sku,
  } = data;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs transition-all hover:border-slate-300 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-xs text-slate-900">
              Warehouse: {warehouseName}
            </span>
            {warehouseCode && (
              <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {warehouseCode}
              </span>
            )}
          </div>
          {productName && (
            <div className="text-[11px] text-slate-500 mt-0.5">
              {productName} {sku ? `• SKU: ${sku}` : ""}
            </div>
          )}
        </div>

        <StockIndicator freeStock={freeStock} />
      </div>

      {/* Metric Grid */}
      <div className={`grid grid-cols-3 gap-2 text-center ${compact ? "pt-2" : "pt-2.5"}`}>
        <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
            Available
          </span>
          <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
            {availableStock.toLocaleString()}
          </span>
        </div>

        <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
            Reserved
          </span>
          <span className="font-mono font-bold text-amber-700 text-xs mt-0.5 block">
            {reservedStock.toLocaleString()}
          </span>
        </div>

        <div className="p-2 rounded bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] text-emerald-800 uppercase tracking-wider block font-semibold">
            Free Stock
          </span>
          <span className="font-mono font-bold text-emerald-700 text-xs mt-0.5 block">
            {freeStock.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer Timestamp */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-600" />
          <span>Last Updated: {lastUpdated}</span>
        </span>
        <span className="text-slate-600 font-medium">Real-time Stock Verification</span>
      </div>
    </div>
  );
};
