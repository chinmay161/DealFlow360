import React from "react";
import { AlertTriangle, Clock, Building2, Package, XCircle, ChevronRight, X } from "lucide-react";

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";

export interface AlertData {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type?: "EXPIRY" | "DELAY" | "CAPACITY" | "SHORTAGE" | string;
  entityId?: string;
  entityType?: "RESERVATION" | "SHIPMENT" | "WAREHOUSE" | "PRODUCT";
  timestamp?: string;
  actionLabel?: string;
}

interface AlertCardProps {
  alert: AlertData;
  onAction?: (alert: AlertData) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAction,
  onDismiss,
  className = "",
}) => {
  const getIcon = () => {
    switch (alert.type) {
      case "EXPIRY":
        return <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case "DELAY":
        return <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      case "CAPACITY":
        return <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />;
      case "SHORTAGE":
        return <Package className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      default:
        return alert.severity === "CRITICAL" ? (
          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        );
    }
  };

  const getStyle = () => {
    switch (alert.severity) {
      case "CRITICAL":
        return "bg-rose-50/70 border-rose-200/90 text-rose-950 hover:bg-rose-50";
      case "WARNING":
        return "bg-amber-50/70 border-amber-200/90 text-amber-950 hover:bg-amber-50";
      case "INFO":
      default:
        return "bg-blue-50/70 border-blue-200/90 text-blue-950 hover:bg-blue-50";
    }
  };

  return (
    <div
      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-150 ${getStyle()} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1 rounded-lg bg-white/80 shadow-xs">{getIcon()}</div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold">{alert.title}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-white/80 border border-current/20 shadow-2xs">
              {alert.severity}
            </span>
            {alert.entityId && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/70 text-slate-700">
                {alert.entityId}
              </span>
            )}
          </div>
          <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
          {alert.timestamp && (
            <span className="text-[10px] opacity-70 block pt-0.5">{alert.timestamp}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {onAction && (
          <button
            onClick={() => onAction(alert)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 hover:bg-white text-slate-800 border border-slate-200/80 shadow-2xs inline-flex items-center gap-1 transition-colors"
          >
            <span>{alert.actionLabel || "Inspect"}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors"
            title="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
