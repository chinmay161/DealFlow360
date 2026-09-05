import React from "react";
import { Building, Truck } from "lucide-react";

export interface WarehouseComparisonItem {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
  availableStock: number;
  reservedStock: number;
  utilizationRate: number;
  leadTimeDays?: number;
  status: "ACTIVE" | "MAINTENANCE" | "FULL";
}

interface WarehouseComparisonProps {
  warehouses: WarehouseComparisonItem[];
  className?: string;
}

export const WarehouseComparison: React.FC<WarehouseComparisonProps> = ({
  warehouses,
  className = "",
}) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-xs text-slate-900">
            Regional Warehouse Comparison &amp; Capacity Distribution
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          PAN-India Fulfillment Network
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="py-2 px-3 font-semibold">Warehouse Hub</th>
              <th className="py-2 px-3 font-semibold text-right">Capacity</th>
              <th className="py-2 px-3 font-semibold text-right">Available</th>
              <th className="py-2 px-3 font-semibold text-right">Reserved</th>
              <th className="py-2 px-3 font-semibold text-right">Free Stock</th>
              <th className="py-2 px-3 font-semibold">Capacity Utilization</th>
              <th className="py-2 px-3 font-semibold text-center">Dispatch Lead Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-body-sm">
            {warehouses.map((w) => {
              const freeStock = Math.max(0, w.availableStock - w.reservedStock);
              const isHighUtil = w.utilizationRate >= 85;

              return (
                <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{w.name}</span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {w.code}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">{w.location}</span>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                    {w.capacity.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                    {w.availableStock.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-medium">
                    {w.reservedStock.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    {freeStock.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-3 w-44">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className={isHighUtil ? "text-amber-700 font-bold" : "text-slate-600"}>
                          {w.utilizationRate}%
                        </span>
                        {isHighUtil && (
                          <span className="text-[9px] text-amber-700 font-semibold uppercase">Near Capacity</span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isHighUtil ? "bg-amber-500" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(100, w.utilizationRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      <Truck className="w-3 h-3 text-slate-500" />
                      <span>{w.leadTimeDays || 1} Day{w.leadTimeDays !== 1 ? "s" : ""}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
