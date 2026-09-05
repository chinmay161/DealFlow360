"use client";

import React, { useState } from "react";
import { Bookmark, RefreshCw } from "lucide-react";
import { ReservationCard } from "../components/ReservationCard";
import { useReservations } from "../hooks/useReservations";
import { Button } from "@/components/ui/button";

export const ReservationDashboardPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useReservations({
    search,
    warehouse,
    status,
    page,
    limit: 10,
  });

  const reservations = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
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

      {/* Reservation Table Component */}
      <ReservationCard
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
      />
    </div>
  );
};
