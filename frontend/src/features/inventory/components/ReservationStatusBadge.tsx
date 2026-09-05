import React from "react";
import { Bookmark, CheckCircle2, Clock, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import type { ReservationStatusType } from "../types/inventory.types";

interface ReservationStatusBadgeProps {
  status: ReservationStatusType | string;
  className?: string;
  showIcon?: boolean;
}

export const ReservationStatusBadge: React.FC<ReservationStatusBadgeProps> = ({
  status,
  className = "",
  showIcon = true,
}) => {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "RESERVED":
    case "CONFIRMED":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 ${className}`}
        >
          {showIcon && <Bookmark className="w-3 h-3 text-blue-600" />}
          <span>Reserved</span>
        </span>
      );
    case "FULFILLED":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          <span>Fulfilled</span>
        </span>
      );
    case "RELEASED":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 ${className}`}
        >
          {showIcon && <RotateCcw className="w-3 h-3 text-slate-500" />}
          <span>Released</span>
        </span>
      );
    case "EXPIRED":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
        >
          {showIcon && <Clock className="w-3 h-3 text-amber-600" />}
          <span>Expired</span>
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}
        >
          {showIcon && <XCircle className="w-3 h-3 text-rose-600" />}
          <span>Cancelled</span>
        </span>
      );
    case "PENDING":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50/80 text-amber-800 border border-amber-300/80 ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3 h-3 text-amber-600" />}
          <span>Pending Approval</span>
        </span>
      );
  }
};
