import React from "react";
import {
  FileCheck,
  BookmarkCheck,
  PackageCheck,
  Send,
  Truck,
  CheckCircle2,
  Clock,
  Circle,
} from "lucide-react";
import type { VerticalTimelineStep, FulfillmentTimelineStage } from "../types/inventory.types";

interface ShipmentTimelineProps {
  steps?: VerticalTimelineStep[];
  currentStatus?: string;
  className?: string;
  quotationNumber?: string;
  shipmentNumber?: string;
}

export const ShipmentTimeline: React.FC<ShipmentTimelineProps> = ({
  steps,
  currentStatus = "PACKED",
  className = "",
  quotationNumber,
  shipmentNumber,
}) => {
  // Fallback default 6 stages if no custom step array is passed
  const defaultSteps: VerticalTimelineStep[] = [
    {
      stage: "Quotation Approved",
      label: "Commercial Proposal Approved",
      description: "Governance clearance granted; order released for fulfillment",
      timestamp: "05 Sep 2026, 11:30 AM",
      status: "completed",
    },
    {
      stage: "Inventory Reserved",
      label: "Stock Allocated & Locked",
      description: "SKU quantity reserved exclusively at origin warehouse",
      timestamp: "05 Sep 2026, 12:15 PM",
      status: "completed",
    },
    {
      stage: "Packed",
      label: "Consignment Packed & Verified",
      description: "Items picked, barcode-verified, and packed for carrier transit",
      timestamp: "05 Sep 2026, 04:45 PM",
      status: currentStatus === "PACKED" ? "current" : "completed",
    },
    {
      stage: "Dispatched",
      label: "Dispatched from Hub",
      description: "Handed over to carrier partner at origin dispatch dock",
      timestamp:
        currentStatus === "SHIPPED" || currentStatus === "IN_TRANSIT" || currentStatus === "DELIVERED"
          ? "06 Sep 2026, 09:00 AM"
          : "Pending carrier pickup",
      status:
        currentStatus === "SHIPPED"
          ? "current"
          : currentStatus === "IN_TRANSIT" || currentStatus === "DELIVERED"
          ? "completed"
          : "pending",
    },
    {
      stage: "In Transit",
      label: "In Transit with Carrier",
      description: "Consignment travelling via linehaul regional route",
      timestamp:
        currentStatus === "IN_TRANSIT" || currentStatus === "DELIVERED"
          ? "06 Sep 2026, 01:20 PM"
          : "Route movement scheduled",
      status:
        currentStatus === "IN_TRANSIT"
          ? "current"
          : currentStatus === "DELIVERED"
          ? "completed"
          : "pending",
    },
    {
      stage: "Delivered",
      label: "Delivered to Customer",
      description: "Consignment acknowledged and receipt signed by consignee",
      timestamp: currentStatus === "DELIVERED" ? "06 Sep 2026, 05:40 PM" : "Estimated 1-2 days",
      status: currentStatus === "DELIVERED" ? "completed" : "pending",
    },
  ];

  const timelineSteps = steps && steps.length > 0 ? steps : defaultSteps;

  const getStageIcon = (stage: FulfillmentTimelineStage, _status?: VerticalTimelineStep["status"]) => {
    switch (stage) {
      case "Quotation Approved":
        return <FileCheck className="w-4 h-4" />;
      case "Inventory Reserved":
        return <BookmarkCheck className="w-4 h-4" />;
      case "Packed":
        return <PackageCheck className="w-4 h-4" />;
      case "Dispatched":
        return <Send className="w-4 h-4" />;
      case "In Transit":
        return <Truck className="w-4 h-4" />;
      case "Delivered":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStepIndicator = (status: VerticalTimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-emerald-600 text-white shadow-xs border-emerald-600 ring-4 ring-emerald-50";
      case "current":
        return "bg-blue-600 text-white shadow-md border-blue-600 ring-4 ring-blue-100 animate-pulse";
      case "cancelled":
        return "bg-rose-600 text-white shadow-xs border-rose-600 ring-4 ring-rose-50";
      case "pending":
      default:
        return "bg-slate-100 text-slate-400 border-slate-200";
    }
  };

  const getBadgeStyle = (status: VerticalTimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "current":
        return "bg-blue-50 text-blue-700 border-blue-300 font-bold";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "pending":
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Fulfillment &amp; Consignment Lifecycle</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end milestone tracking from deal approval through customer delivery
          </p>
        </div>

        <div className="flex items-center gap-2">
          {quotationNumber && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Quote: <strong>{quotationNumber}</strong>
            </span>
          )}
          {shipmentNumber && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Shipment: <strong>{shipmentNumber}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Vertical Steps */}
      <div className="relative pl-3">
        {timelineSteps.map((step, idx) => {
          const isLast = idx === timelineSteps.length - 1;
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";

          return (
            <div key={idx} className="relative flex items-start gap-4 pb-7 last:pb-2 group">
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className={`absolute left-[17px] top-9 bottom-0 w-0.5 transition-colors ${
                    isCompleted ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}

              {/* Node Icon */}
              <div
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${getStepIndicator(
                  step.status
                )}`}
              >
                {getStageIcon(step.stage, step.status)}
              </div>

              {/* Content Box */}
              <div className="flex-1 pt-0.5 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-blue-900 font-extrabold"
                          : isCompleted
                          ? "text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {step.stage}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                        step.status
                      )}`}
                    >
                      {step.status === "current"
                        ? "In Progress"
                        : step.status === "completed"
                        ? "Completed"
                        : "Pending"}
                    </span>
                  </div>

                  {step.timestamp && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{step.timestamp}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs font-medium text-slate-800">
                  {step.label}
                </div>

                {step.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
