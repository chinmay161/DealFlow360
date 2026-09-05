import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ArrowRight, Truck } from "lucide-react";
import type { WarehouseDetail } from "../types/inventory.types";

interface WarehouseCardProps {
  warehouse: WarehouseDetail;
  onSelect: (warehouse: WarehouseDetail) => void;
  isManager?: boolean;
}

export const WarehouseCard: React.FC<WarehouseCardProps> = ({
  warehouse,
  onSelect,
  isManager = false,
}) => {
  const getUtilColor = (rate: number) => {
    if (rate >= 85) return { bar: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-50" };
    if (rate >= 65) return { bar: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" };
    return { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" };
  };

  const utilStyle = getUtilColor(warehouse.utilizationRate);

  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      <div className="p-5">
        {/* Header with Code Badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {warehouse.name}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{warehouse.location}</span>
                </div>
              </div>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {warehouse.code}
          </span>
        </div>

        {/* Capacity Utilization Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Capacity Utilization</span>
            <span className={`font-mono font-bold ${utilStyle.text}`}>
              {warehouse.utilizationRate}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${utilStyle.bar} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, warehouse.utilizationRate)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{warehouse.totalOnHand} units stored</span>
            <span>Max Cap: {warehouse.capacity}</span>
          </div>
        </div>

        {/* Operational Metrics Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/50">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Products</span>
            <span className="text-xs font-bold font-mono text-slate-800">
              {warehouse.productsCount}
            </span>
          </div>
          <div className="text-center border-x border-slate-200/60">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Available</span>
            <span className="text-xs font-bold font-mono text-emerald-700">
              {warehouse.totalAvailable.toLocaleString()}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Reserved</span>
            <span className="text-xs font-bold font-mono text-blue-700">
              {warehouse.totalReserved.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Manager Operational Insights */}
        {isManager && (
          <div className="mt-3 flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-blue-50/50 border border-blue-100 text-blue-900 font-medium">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3 text-blue-600" />
              {warehouse.activeShipmentsCount} Inbound/Outbound
            </span>
            <span>{warehouse.activeReservationsCount} Allocations</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-medium">
          Indian Regional Hub
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(warehouse)}
          className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 p-0 px-2"
        >
          <span>View Hub Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
};
