import React from "react";
import { Truck, Package, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { ShipmentStatusType } from "../types/inventory.types";

interface ShipmentStatusBadgeProps {
  status: ShipmentStatusType | string;
  className?: string;
  showIcon?: boolean;
}

export const ShipmentStatusBadge: React.FC<ShipmentStatusBadgeProps> = ({
  status,
  className = "",
  showIcon = true,
}) => {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "DELIVERED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          <span>Delivered</span>
        </span>
      );
    case "SHIPPED":
    case "DISPATCHED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 ${className}`}
        >
          {showIcon && <Truck className="w-3 h-3 text-blue-600" />}
          <span>Dispatched</span>
        </span>
      );
    case "IN_TRANSIT":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${className}`}
        >
          {showIcon && <Truck className="w-3 h-3 text-indigo-600" />}
          <span>In Transit</span>
        </span>
      );
    case "PACKED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 ${className}`}
        >
          {showIcon && <Package className="w-3 h-3 text-purple-600" />}
          <span>Packed</span>
        </span>
      );
    case "READY":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
        >
          {showIcon && <Clock className="w-3 h-3 text-amber-600" />}
          <span>Ready for Dispatch</span>
        </span>
      );
    case "PLANNED":
    case "PENDING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 ${className}`}
        >
          {showIcon && <Clock className="w-3 h-3 text-slate-500" />}
          <span>Pending Dispatch</span>
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}
        >
          {showIcon && <XCircle className="w-3 h-3 text-rose-600" />}
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200/80 ${className}`}
        >
          {showIcon && <AlertCircle className="w-3 h-3 text-slate-400" />}
          <span>{status}</span>
        </span>
      );
  }
};
