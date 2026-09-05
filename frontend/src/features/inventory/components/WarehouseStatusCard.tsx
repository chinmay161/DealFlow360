import React from "react";
import { Card } from "@/components/ui/card";
import { Building2, Package, Bookmark, Truck, BarChart2 } from "lucide-react";
import type { WarehouseDetail } from "../types/inventory.types";

interface WarehouseStatusCardProps {
  warehouse: WarehouseDetail | {
    id: string;
    code: string;
    name: string;
    location?: string;
    totalAvailable?: number;
    totalReserved?: number;
    activeShipmentsCount?: number;
    capacity?: number;
    utilizationRate?: number;
  };
  onClick?: () => void;
  className?: string;
}

export const WarehouseStatusCard: React.FC<WarehouseStatusCardProps> = ({
  warehouse,
  onClick,
  className = "",
}) => {
  const available = warehouse.totalAvailable ?? 0;
  const reserved = warehouse.totalReserved ?? 0;
  const outgoing = warehouse.activeShipmentsCount ?? 0;
  const capacity = warehouse.capacity ?? (available + reserved > 0 ? (available + reserved) * 1.3 : 10000);
  const utilization = warehouse.utilizationRate ?? Math.min(100, Math.round(((available + reserved) / (capacity || 1)) * 100));

  const getCapacityColor = (rate: number) => {
    if (rate >= 90) return "bg-rose-500";
    if (rate >= 75) return "bg-amber-500";
    return "bg-blue-600";
  };

  return (
    <Card
      onClick={onClick}
      className={`p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all ${
        onClick ? "cursor-pointer hover:shadow-sm" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-blue-700">
                {warehouse.code}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {warehouse.name}
              </span>
            </div>
            {warehouse.location && (
              <p className="text-[11px] text-slate-400">{warehouse.location}</p>
            )}
          </div>
        </div>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
          {utilization}% Capacity
        </span>
      </div>

      {/* Metrics 4-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
        <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <Package className="w-3 h-3 text-emerald-600" />
            <span>Available</span>
          </div>
          <div className="text-sm font-bold font-mono text-emerald-700">
            {available.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Units</div>
        </div>

        <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <Bookmark className="w-3 h-3 text-blue-600" />
            <span>Reserved</span>
          </div>
          <div className="text-sm font-bold font-mono text-blue-700">
            {reserved.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Units</div>
        </div>

        <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <Truck className="w-3 h-3 text-purple-600" />
            <span>Outgoing</span>
          </div>
          <div className="text-sm font-bold font-mono text-purple-700">
            {outgoing}
          </div>
          <div className="text-[10px] text-slate-400">Shipments</div>
        </div>

        <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <BarChart2 className="w-3 h-3 text-slate-500" />
            <span>Capacity</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-800">
            {Math.round(capacity).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Max Vol</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
        <div className="flex justify-between items-center text-[10px] text-slate-500">
          <span>Storage Utilization</span>
          <span className="font-semibold font-mono text-slate-700">{utilization}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${getCapacityColor(utilization)} transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(2, utilization))}%` }}
          />
        </div>
      </div>
    </Card>
  );
};
