import React from "react";
import { Card } from "@/components/ui/card";
import { Truck, MapPin, Building2, Package, CheckCircle2, Clock } from "lucide-react";
import type { ShipmentRecord, ShipmentStatusType } from "../types/inventory.types";

interface ShipmentCardProps {
  shipment: ShipmentRecord;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment }) => {
  const getStatusBadge = (status: ShipmentStatusType) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case "SHIPPED":
      case "IN_TRANSIT":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">In Transit</span>;
      case "PACKED":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Packed</span>;
      case "READY":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Ready</span>;
      case "PLANNED":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Planned</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">{status}</span>;
    }
  };

  return (
    <Card className="p-5 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">
                {shipment.shipmentNumber}
              </span>
              {getStatusBadge(shipment.status)}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Order: <strong className="text-slate-700 font-mono">{shipment.orderNumber}</strong></span>
              {shipment.quotationNumber && (
                <>
                  <span>•</span>
                  <span>Quote: <strong className="text-blue-600 font-mono">{shipment.quotationNumber}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-slate-900 font-mono">
            {shipment.reservedQuantity} Units
          </div>
          <div className="text-[10px] text-slate-400">Total Shipment Qty</div>
        </div>
      </div>

      {/* Origin, Destination & Carrier Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">Origin Hub</span>
          <div className="flex items-center gap-1 font-medium text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{shipment.warehouseName} ({shipment.warehouseCode})</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">Destination</span>
          <div className="flex items-center gap-1 font-medium text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span className="line-clamp-1">{shipment.destination}</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">Logistics Carrier</span>
          <div className="flex items-center gap-1 font-medium text-slate-800">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span className="line-clamp-1">{shipment.carrier}</span>
          </div>
        </div>
      </div>

      {/* 4-Stage Interactive Visual Timeline: Reserved -> Packed -> Shipped -> Delivered */}
      <div className="pt-2">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Consignment Fulfillment Milestones
        </div>
        <div className="grid grid-cols-4 gap-1.5 relative">
          {shipment.timeline.map((step, idx) => {
            const isFinished = step.completed;
            const isCurrent = step.current;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isFinished
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : isCurrent
                    ? "bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-400/50"
                    : "bg-slate-50/40 border-slate-200 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isFinished ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-slate-300" />
                  )}
                </div>
                <div className="text-xs font-bold leading-tight">
                  {step.stage}
                </div>
                <div className="text-[10px] mt-0.5 opacity-80 line-clamp-1">
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items List Mini Pills */}
      {shipment.items && shipment.items.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Products:</span>
          {shipment.items.map((it, idx) => (
            <span
              key={idx}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
            >
              {it.sku}: {it.quantity}x
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};
