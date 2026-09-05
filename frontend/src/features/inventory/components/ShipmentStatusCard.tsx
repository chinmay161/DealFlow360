import React from "react";
import { Truck } from "lucide-react";

export interface ShipmentStatusData {
  id?: string;
  shipmentNumber: string;
  carrier?: string;
  trackingNumber?: string;
  status: "PLANNED" | "READY" | "PACKED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";
  estimatedDelivery?: string;
  shippedAt?: string;
  originWarehouse?: string;
}

interface ShipmentStatusCardProps {
  data: ShipmentStatusData;
  className?: string;
}

export const ShipmentStatusCard: React.FC<ShipmentStatusCardProps> = ({
  data,
  className = "",
}) => {
  const {
    shipmentNumber,
    carrier = "BlueDart Express",
    trackingNumber,
    status,
    estimatedDelivery = "Tomorrow",
    originWarehouse = "Mumbai Hub",
  } = data;

  const isDelivered = status === "DELIVERED";
  const isInTransit = status === "IN_TRANSIT" || status === "SHIPPED";

  return (
    <div
      className={`p-3.5 rounded-lg border text-xs shadow-xs transition-all bg-white border-slate-200 hover:border-slate-300 ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Truck className="w-4 h-4 text-primary" />
          <span>Shipment: <strong className="font-mono text-primary">{shipmentNumber}</strong></span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isDelivered
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : isInTransit
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2.5 text-center">
        <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">Carrier</span>
          <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate" title={carrier}>
            {carrier}
          </span>
        </div>

        <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">Status</span>
          <span className="font-semibold text-slate-800 text-xs mt-0.5 block capitalize">
            {status.toLowerCase().replace("_", " ")}
          </span>
        </div>

        <div className="p-2 rounded bg-emerald-50/40 border border-emerald-100">
          <span className="text-[10px] text-emerald-800 uppercase block font-semibold">
            Est. Delivery
          </span>
          <span className="font-semibold text-emerald-700 text-xs mt-0.5 block truncate">
            {estimatedDelivery}
          </span>
        </div>
      </div>

      {(trackingNumber || originWarehouse) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Origin: {originWarehouse}</span>
          {trackingNumber && <span>Tracking: {trackingNumber}</span>}
        </div>
      )}
    </div>
  );
};
