"use client";

import React, { useState } from "react";
import { Building2, Search } from "lucide-react";
import { WarehouseCard } from "../components/WarehouseCard";
import { WarehouseComparisonChart } from "../components/WarehouseComparisonChart";
import { WarehouseDetailDrawer } from "../components/WarehouseDetailDrawer";
import { WarehouseCardSkeleton } from "../components/LoadingSkeleton";
import { useWarehouses } from "../hooks/useWarehouses";
import { useInventoryRole } from "../context/InventoryRoleContext";
import type { UserInventoryRole } from "../types/inventory.types";

interface WarehouseOverviewPageProps {
  userRole?: UserInventoryRole;
}

export const WarehouseOverviewPage: React.FC<WarehouseOverviewPageProps> = ({
  userRole: propRole,
}) => {
  const { role: contextRole } = useInventoryRole();
  const effectiveRole = propRole || contextRole;
  const isManager = effectiveRole === "MANAGER";
  const { data: warehouses = [], isLoading } = useWarehouses();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredWarehouses = warehouses.filter(
    (wh) =>
      wh.name.toLowerCase().includes(search.toLowerCase()) ||
      wh.code.toLowerCase().includes(search.toLowerCase()) ||
      wh.location.toLowerCase().includes(search.toLowerCase())
  );

  const comparisonData = warehouses.map((wh) => ({
    warehouse: wh.name,
    code: wh.code,
    availableStock: wh.totalAvailable,
    reservedStock: wh.totalReserved,
    totalCapacity: wh.capacity,
    utilization: wh.utilizationRate,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Regional Warehouses &amp; Distribution Hubs
            </h2>
            <p className="text-xs text-slate-500">
              Pan-India logistics facilities managing stock buffers, quotation allocations, and outbound transit
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search warehouse..."
            className="w-full pl-9 pr-3 h-9 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      {isLoading ? (
        <WarehouseCardSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredWarehouses.map((wh) => (
            <WarehouseCard
              key={wh.id}
              warehouse={wh}
              isManager={isManager}
              onSelect={(item) => setSelectedWarehouseId(item.id)}
            />
          ))}
        </div>
      )}

      {/* Warehouse Comparison Chart */}
      <WarehouseComparisonChart data={comparisonData} isLoading={isLoading} />

      {/* Warehouse Detail Drawer / Modal */}
      <WarehouseDetailDrawer
        warehouseId={selectedWarehouseId}
        onClose={() => setSelectedWarehouseId(null)}
      />
    </div>
  );
};
