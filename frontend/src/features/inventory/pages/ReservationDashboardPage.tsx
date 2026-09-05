"use client";

import React, { useState } from "react";
import { Bookmark, RefreshCw, AlertTriangle } from "lucide-react";
import { ReservationTable } from "../components/ReservationTable";
import { ReservationDetailsModal } from "../components/ReservationDetailsModal";
import { WarehouseStatusCard } from "../components/WarehouseStatusCard";
import { AlertCard, type AlertData } from "../components/AlertCard";
import { useReservations } from "../hooks/useReservations";
import { useWarehouses } from "../hooks/useWarehouses";
import { Button } from "@/components/ui/button";
import type { ReservationRecord } from "../types/inventory.types";

export const ReservationDashboardPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedReservation, setSelectedReservation] = useState<ReservationRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useReservations({
    search,
    warehouse,
    status,
    page,
    limit: 10,
  });

  const { data: warehousesList, isLoading: isWarehousesLoading } = useWarehouses();

  const reservations = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  // Active fulfillment alerts
  const sampleAlerts: AlertData[] = [
    {
      id: "res-alert-1",
      title: "Reservation Expiry Warning",
      message: "Quotation Q-2026-0891 allocation of 40 units expires in 24 hours. Awaiting manager approval signoff.",
      severity: "WARNING",
      type: "EXPIRY",
      entityId: "RSV-BOM-0891",
      entityType: "RESERVATION",
      timestamp: "Triggered 2 hours ago",
      actionLabel: "View Deal",
    },
    {
      id: "res-alert-2",
      title: "Warehouse High Utilization",
      message: "Mumbai Central Hub (WH-BOM) currently operating at 84% allocated capacity. Monitor outbound dispatches.",
      severity: "INFO",
      type: "CAPACITY",
      entityId: "WH-BOM",
      entityType: "WAREHOUSE",
      timestamp: "Updated 15 mins ago",
      actionLabel: "View Hub",
    },
  ];

  const handleOpenModal = (res: ReservationRecord) => {
    setSelectedReservation(res);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Quotation Inventory Reservations &amp; Allocations
            </h2>
            <p className="text-xs text-slate-500">
              Read-only view of stock committed to approved commercial proposals and pending review deals
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
          <span>Refresh</span>
        </Button>
      </div>

      {/* Fulfillment Alerts */}
      <div className="space-y-2.5">
        {sampleAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAction={() => {
              if (reservations.length > 0) {
                handleOpenModal(reservations[0]);
              }
            }}
          />
        ))}
      </div>

      {/* Warehouse Status Overview Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Regional Hub Storage &amp; Allocation Status
          </h3>
          <span className="text-[11px] text-slate-400">Live Network Telemetry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {isWarehousesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-xl border border-slate-200/80 animate-pulse" />
            ))
          ) : warehousesList && warehousesList.length > 0 ? (
            warehousesList.slice(0, 3).map((wh) => (
              <WarehouseStatusCard
                key={wh.id}
                warehouse={wh}
                onClick={() => {
                  setWarehouse(wh.id);
                  setPage(1);
                }}
              />
            ))
          ) : (
            <>
              <WarehouseStatusCard
                warehouse={{
                  id: "wh-bom",
                  code: "WH-BOM",
                  name: "Mumbai Central Hub",
                  location: "Bhiwandi, Maharashtra",
                  totalAvailable: 7420,
                  totalReserved: 1850,
                  activeShipmentsCount: 12,
                  capacity: 10000,
                  utilizationRate: 74,
                }}
              />
              <WarehouseStatusCard
                warehouse={{
                  id: "wh-blr",
                  code: "WH-BLR",
                  name: "Bengaluru South Hub",
                  location: "Whitefield, Karnataka",
                  totalAvailable: 4980,
                  totalReserved: 920,
                  activeShipmentsCount: 8,
                  capacity: 8500,
                  utilizationRate: 59,
                }}
              />
              <WarehouseStatusCard
                warehouse={{
                  id: "wh-del",
                  code: "WH-DEL",
                  name: "Delhi NCR Hub",
                  location: "Gurugram, Haryana",
                  totalAvailable: 3120,
                  totalReserved: 1430,
                  activeShipmentsCount: 5,
                  capacity: 6000,
                  utilizationRate: 52,
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Error state if query fails */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Failed to synchronize reservations from database.</span>
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

      {/* Professional Reservation Table */}
      <ReservationTable
        reservations={reservations}
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
        onSelectReservation={handleOpenModal}
      />

      {/* Detailed Reservation Inspection Modal */}
      <ReservationDetailsModal
        reservation={selectedReservation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
