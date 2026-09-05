"use client";

import React, { useState } from "react";
import { Truck, RefreshCw, LayoutGrid, Table as TableIcon, AlertTriangle } from "lucide-react";
import { ShipmentTable } from "../components/ShipmentTable";
import { ShipmentCard } from "../components/ShipmentCard";
import { ShipmentStatusCards } from "../components/ShipmentStatusCards";
import { ShipmentDetailsModal } from "../components/ShipmentDetailsModal";
import { AlertCard, type AlertData } from "../components/AlertCard";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { EmptyState } from "../components/EmptyState";
import { useShipments } from "../hooks/useShipments";
import { Button } from "@/components/ui/button";
import type { ShipmentRecord } from "../types/inventory.types";

export const ShipmentDashboardPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useShipments({
    search,
    warehouse,
    status,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  });

  const shipments = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  const sampleAlerts: AlertData[] = [
    {
      id: "ship-alert-1",
      title: "Shipment Transit Monitoring",
      message: "Consignment SHP-10482 via BlueDart experiencing road corridor delay near Pune. Updated ETA: Tomorrow 4:00 PM.",
      severity: "WARNING",
      type: "DELAY",
      entityId: "SHP-10482",
      entityType: "SHIPMENT",
      timestamp: "Reported 45 mins ago",
      actionLabel: "Track Consignment",
    },
    {
      id: "ship-alert-2",
      title: "Stock Reservation Buffer Notice",
      message: "Low inventory on SKU PROD-SRV-X1 at Delhi NCR Hub may affect secondary batch dispatches for Quotation Q-2026-0744.",
      severity: "INFO",
      type: "SHORTAGE",
      entityId: "PROD-SRV-X1",
      entityType: "PRODUCT",
      timestamp: "Updated 1 hour ago",
      actionLabel: "Inspect Stock",
    },
  ];

  const handleSortChange = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  const handleOpenModal = (s: ShipmentRecord) => {
    setSelectedShipment(s);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Outbound Shipments &amp; Consignment Tracking
            </h2>
            <p className="text-xs text-slate-500">
              Real-time milestone tracking for dispatched orders: Quotation Approved → Reserved → Packed → Dispatched → Delivered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs font-semibold gap-1.5 border-slate-200 text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </Button>
        </div>
      </div>

      {/* Top KPIs - Shipment Status Cards */}
      <ShipmentStatusCards
        shipments={shipments}
        activeFilter={status}
        onFilterClick={(newStatus) => {
          setStatus(newStatus);
          setPage(1);
        }}
        isLoading={isLoading}
      />

      {/* Consignment & Logistics Alerts */}
      <div className="space-y-2.5">
        {sampleAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAction={() => {
              if (shipments.length > 0) {
                handleOpenModal(shipments[0]);
              }
            }}
          />
        ))}
      </div>

      {/* Error state if query fails */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Failed to synchronize shipment telemetry from carrier network.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs bg-white text-rose-800 border-rose-200"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* View Switch: Professional Table vs Card Grid */}
      {viewMode === "table" ? (
        <ShipmentTable
          shipments={shipments}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          search={search}
          onSearchChange={(s) => {
            setSearch(s);
            setPage(1);
          }}
          warehouseFilter={warehouse}
          onWarehouseChange={(wh) => {
            setWarehouse(wh);
            setPage(1);
          }}
          statusFilter={status}
          onStatusChange={(st) => {
            setStatus(st);
            setPage(1);
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onSelectShipment={handleOpenModal}
        />
      ) : (
        <div className="space-y-4">
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
                <ShipmentCard
                  key={s.id}
                  shipment={s}
                  onViewDetails={handleOpenModal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Shipment & Vertical Timeline Modal */}
      <ShipmentDetailsModal
        shipment={selectedShipment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
