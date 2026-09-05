import React from "react";
import { AlertTriangle, XCircle, Clock, Bookmark, Info, ArrowRight } from "lucide-react";
import type { InventoryAlertItem } from "../types/inventory.types";

interface InventoryAlertProps {
  alerts: InventoryAlertItem[];
  onActionClick?: (alert: InventoryAlertItem) => void;
}

export const InventoryAlert: React.FC<InventoryAlertProps> = ({ alerts, onActionClick }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-800 text-xs flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>All regional distribution hubs and SKU buffer levels operating normally. No active inventory anomalies.</span>
      </div>
    );
  }

  const getAlertIcon = (type: InventoryAlertItem["type"], _severity?: InventoryAlertItem["severity"]) => {
    switch (type) {
      case "OUT_OF_STOCK":
        return <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      case "LOW_STOCK":
        return <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case "SHIPMENT_DELAY":
        return <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />;
      case "LARGE_RESERVATION":
      case "EXPIRY_WARNING":
        return <Bookmark className="w-4 h-4 text-purple-600 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />;
    }
  };

  const getSeverityStyle = (severity: InventoryAlertItem["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-50/60 border-rose-200 text-rose-950";
      case "WARNING":
        return "bg-amber-50/60 border-amber-200 text-amber-950";
      case "INFO":
      default:
        return "bg-blue-50/60 border-blue-200 text-blue-950";
    }
  };

  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${getSeverityStyle(
            alert.severity
          )}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getAlertIcon(alert.type, alert.severity)}</div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{alert.title}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-white/70 border border-current/20">
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs opacity-90">{alert.message}</p>
              {alert.actionHint && (
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 italic pt-0.5">
                  💡 Hint: {alert.actionHint}
                </p>
              )}
            </div>
          </div>

          {onActionClick && (
            <button
              onClick={() => onActionClick(alert)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 self-end sm:self-center"
            >
              <span>Review</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
