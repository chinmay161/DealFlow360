import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, MapPin } from "lucide-react";
import { useWarehouseDetails } from "../hooks/useWarehouses";
import { InventoryStatusBadge } from "./InventoryStatusBadge";
import { TableSkeleton } from "./LoadingSkeleton";

interface WarehouseDetailDrawerProps {
  warehouseId: string | null;
  onClose: () => void;
}

export const WarehouseDetailDrawer: React.FC<WarehouseDetailDrawerProps> = ({
  warehouseId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"products" | "reservations" | "shipments">("products");
  const { data, isLoading } = useWarehouseDetails(warehouseId);

  if (!warehouseId) return null;

  const wh = data?.warehouse;
  const products = data?.products || [];
  const reservations = data?.reservations || [];
  const shipments = data?.shipments || [];

  return (
    <Dialog open={Boolean(warehouseId)} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-2xl border border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-slate-900">
                    {wh?.name || "Warehouse Details"}
                  </DialogTitle>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {wh?.code}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{wh?.location}, {wh?.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Header Strip */}
          {wh && (
            <div className="grid grid-cols-4 gap-2 pt-3">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Capacity</span>
                <span className="text-sm font-bold font-mono text-slate-800">{wh.capacity}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-center">
                <span className="text-[10px] uppercase text-emerald-600 font-semibold block">Available</span>
                <span className="text-sm font-bold font-mono text-emerald-800">{wh.totalAvailable}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-center">
                <span className="text-[10px] uppercase text-blue-600 font-semibold block">Reserved</span>
                <span className="text-sm font-bold font-mono text-blue-800">{wh.totalReserved}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-center">
                <span className="text-[10px] uppercase text-amber-600 font-semibold block">Utilization</span>
                <span className="text-sm font-bold font-mono text-amber-800">{wh.utilizationRate}%</span>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-3">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "products"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Stored Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "reservations"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Active Reservations ({reservations.length})
            </button>
            <button
              onClick={() => setActiveTab("shipments")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "shipments"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Consignments ({shipments.length})
            </button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : activeTab === "products" ? (
          <div className="space-y-2 pt-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-slate-200/70 hover:bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{p.sku}</span>
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <InventoryStatusBadge status={p.status} />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{p.categoryName}</div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Available</span>
                    <span className="font-mono font-bold text-slate-800">{p.available}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Reserved</span>
                    <span className="font-mono font-bold text-blue-700">{p.reserved}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Free Stock</span>
                    <span className="font-mono font-bold text-emerald-700">{p.freeStock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "reservations" ? (
          <div className="space-y-2 pt-2">
            {reservations.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No active reservations at this hub.</div>
            ) : (
              reservations.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{r.quotationNumber}</span>
                      <span className="font-semibold text-slate-800">{r.productName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{r.customerName}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">{r.quantity} units</div>
                    <span className="text-[10px] font-semibold text-blue-600 uppercase">{r.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {shipments.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No active consignments at this hub.</div>
            ) : (
              shipments.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{s.shipmentNumber}</span>
                      <span className="font-semibold text-slate-700">Order: {s.orderNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Carrier: {s.carrier} • Tracking: {s.trackingCode || "N/A"}</div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {s.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">{s.itemCount} item line(s)</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 text-right">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
