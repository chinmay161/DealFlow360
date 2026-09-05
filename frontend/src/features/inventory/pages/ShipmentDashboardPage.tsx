"use client";

import React, { useState } from "react";
import { Truck, RefreshCw, Search } from "lucide-react";
import { ShipmentCard } from "../components/ShipmentCard";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { EmptyState } from "../components/EmptyState";
import { useShipments } from "../hooks/useShipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ShipmentDashboardPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page] = useState(1);

  const { data, isLoading, refetch } = useShipments({
    search,
    warehouse,
    status,
    page,
    limit: 12,
  });

  const shipments = data?.data || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Outbound Shipments &amp; Consignment Tracking
            </h2>
            <p className="text-xs text-slate-500">
              Real-time milestone tracking for dispatched orders: Reserved → Packed → Shipped → Delivered
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search consignment, carrier, destination..."
            className="pl-9 h-9 text-xs rounded-lg border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Hubs</option>
            <option value="49c40fd3-bfae-4f7f-af29-23f7c468e8e7">Mumbai (WH-BOM)</option>
            <option value="35590b3a-2157-43d3-a029-3a9a59727245">Bengaluru (WH-BLR)</option>
            <option value="ba73ddc8-b58e-4a38-a920-ac34efe9d3dc">Delhi NCR (WH-DEL)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="READY">Ready</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* Shipment Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TableSkeleton rows={3} />
          <TableSkeleton rows={3} />
        </div>
      ) : shipments.length === 0 ? (
        <EmptyState
          title="No Outbound Shipments Found"
          description="No consignment dispatches match your search or filter parameters."
          icon={Truck}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shipments.map((s) => (
            <ShipmentCard key={s.id} shipment={s} />
          ))}
        </div>
      )}
    </div>
  );
};
