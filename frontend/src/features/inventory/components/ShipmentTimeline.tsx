import React from "react";
import {
  FileText,
  FileCheck,
  BookmarkCheck,
  PackageCheck,
  Send,
  Truck,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
} from "lucide-react";
import type {
  VerticalTimelineStep,
  FulfillmentTimelineStage,
  ShipmentStatusType,
} from "../types/inventory.types";

export interface DeriveLifecycleParams {
  quotationStatus?: string;
  hasApprovals?: boolean;
  hasReservation?: boolean;
  shipmentStatus?: ShipmentStatusType | string | null;
  createdAt?: string | Date | null;
  approvedAt?: string | Date | null;
  reservedAt?: string | Date | null;
  packedAt?: string | Date | null;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
}

function formatTimestamp(d?: Date | string | null): string | undefined {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function deriveFulfillmentLifecycleSteps(params: DeriveLifecycleParams = {}): VerticalTimelineStep[] {
  const {
    quotationStatus = "DRAFT",
    hasApprovals = false,
    hasReservation = false,
    shipmentStatus,
    createdAt,
    approvedAt,
    reservedAt,
    packedAt,
    shippedAt,
    deliveredAt,
  } = params;

  const normalizedStatus = (quotationStatus || "DRAFT").toUpperCase();
  const isSubmitted = normalizedStatus !== "DRAFT" || hasApprovals;
  const isApproved =
    normalizedStatus === "APPROVED" ||
    normalizedStatus === "SENT" ||
    normalizedStatus === "ACCEPTED";
  const isRejected = normalizedStatus === "REJECTED";
  const isCancelled = normalizedStatus === "CANCELLED";

  const upperShipmentStatus = (shipmentStatus || "").toUpperCase();
  const isShipmentPacked =
    upperShipmentStatus === "PACKED" ||
    upperShipmentStatus === "SHIPPED" ||
    upperShipmentStatus === "IN_TRANSIT" ||
    upperShipmentStatus === "DELIVERED";

  const isShipmentDispatched =
    upperShipmentStatus === "SHIPPED" ||
    upperShipmentStatus === "IN_TRANSIT" ||
    upperShipmentStatus === "DELIVERED";

  const isShipmentDelivered = upperShipmentStatus === "DELIVERED";

  // Business Rules & Fulfillment Constraints:
  // A quotation cannot enter fulfillment until it has been approved.
  // Inventory Reserved: Only after quotation is Approved.
  // Packed: Only after reservation exists.
  // Dispatched: Only after packing completed.
  // In Transit: Only after dispatch.
  // Delivered: Only after shipment completion.

  // 1. Draft
  let draftStatus: VerticalTimelineStep["status"] = "completed";
  if (!isSubmitted) {
    draftStatus = "current";
  }

  // 2. Pending Approval
  let pendingApprovalStatus: VerticalTimelineStep["status"] = "pending";
  if (isCancelled || isRejected) {
    pendingApprovalStatus = "cancelled";
  } else if (isApproved) {
    pendingApprovalStatus = "completed";
  } else if (isSubmitted) {
    pendingApprovalStatus = "current";
  }

  // 3. Approved
  let approvedStatus: VerticalTimelineStep["status"] = "pending";
  if (isCancelled || isRejected) {
    approvedStatus = "cancelled";
  } else if (isApproved) {
    approvedStatus = "completed";
  }

  // 4. Inventory Reserved (Constraint: Only after quotation is Approved)
  let reservedStatus: VerticalTimelineStep["status"] = "pending";
  if (isApproved) {
    if (hasReservation) {
      reservedStatus = "completed";
    } else {
      reservedStatus = "current";
    }
  }

  // 5. Packed (Constraint: Only after reservation exists)
  let packedStatus: VerticalTimelineStep["status"] = "pending";
  if (isApproved && hasReservation) {
    if (isShipmentPacked) {
      packedStatus = "completed";
    } else {
      packedStatus = "current";
    }
  }

  // 6. Dispatched (Constraint: Only after packing completed)
  let dispatchedStatus: VerticalTimelineStep["status"] = "pending";
  if (isApproved && hasReservation && isShipmentPacked) {
    if (isShipmentDispatched) {
      dispatchedStatus = "completed";
    } else {
      dispatchedStatus = "current";
    }
  }

  // 7. In Transit (Constraint: Only after dispatch)
  let inTransitStatus: VerticalTimelineStep["status"] = "pending";
  if (isApproved && hasReservation && isShipmentDispatched) {
    if (isShipmentDelivered) {
      inTransitStatus = "completed";
    } else {
      inTransitStatus = "current";
    }
  }

  // 8. Delivered (Constraint: Only after shipment completion)
  let deliveredStatus: VerticalTimelineStep["status"] = "pending";
  if (isApproved && hasReservation && isShipmentDelivered) {
    deliveredStatus = "completed";
  }

  return [
    {
      stage: "Draft",
      label: "Quotation Draft Created",
      description: "Commercial proposal initiated with line items and pricing",
      timestamp: formatTimestamp(createdAt) || (draftStatus === "current" ? "Active Draft" : undefined),
      status: draftStatus,
    },
    {
      stage: "Pending Approval",
      label: "Pending Commercial Approval",
      description: "Governance review for pricing, margin thresholds and policy clearance",
      timestamp:
        pendingApprovalStatus === "current"
          ? "Awaiting Review"
          : pendingApprovalStatus === "completed"
          ? formatTimestamp(createdAt)
          : undefined,
      status: pendingApprovalStatus,
    },
    {
      stage: "Approved",
      label: "Commercial Proposal Approved",
      description: "Governance clearance granted; order released for fulfillment",
      timestamp:
        approvedStatus === "completed"
          ? formatTimestamp(approvedAt || createdAt)
          : undefined,
      status: approvedStatus,
    },
    {
      stage: "Inventory Reserved",
      label: "Stock Allocated & Locked",
      description: "SKU quantity reserved exclusively at origin warehouse",
      timestamp:
        reservedStatus === "completed"
          ? formatTimestamp(reservedAt || approvedAt || createdAt)
          : reservedStatus === "current"
          ? "Awaiting Allocation"
          : undefined,
      status: reservedStatus,
    },
    {
      stage: "Packed",
      label: "Consignment Packed & Verified",
      description: "Items picked, barcode-verified, and packed for carrier transit",
      timestamp:
        packedStatus === "completed"
          ? formatTimestamp(packedAt || reservedAt || createdAt)
          : packedStatus === "current"
          ? "Packing in Progress"
          : undefined,
      status: packedStatus,
    },
    {
      stage: "Dispatched",
      label: "Dispatched from Hub",
      description: "Handed over to carrier partner at origin dispatch dock",
      timestamp:
        dispatchedStatus === "completed"
          ? formatTimestamp(shippedAt)
          : dispatchedStatus === "current"
          ? "Pending Carrier Pickup"
          : undefined,
      status: dispatchedStatus,
    },
    {
      stage: "In Transit",
      label: "In Transit with Carrier",
      description: "Consignment travelling via linehaul regional route",
      timestamp:
        inTransitStatus === "completed"
          ? formatTimestamp(deliveredAt || shippedAt)
          : inTransitStatus === "current"
          ? "En Route"
          : undefined,
      status: inTransitStatus,
    },
    {
      stage: "Delivered",
      label: "Delivered to Customer",
      description: "Consignment acknowledged and receipt signed by consignee",
      timestamp:
        deliveredStatus === "completed"
          ? formatTimestamp(deliveredAt)
          : undefined,
      status: deliveredStatus,
    },
  ];
}

interface ShipmentTimelineProps {
  steps?: VerticalTimelineStep[];
  currentStatus?: string;
  quotationStatus?: string;
  hasApprovals?: boolean;
  hasReservation?: boolean;
  shipmentStatus?: ShipmentStatusType | string | null;
  createdAt?: string | Date | null;
  approvedAt?: string | Date | null;
  reservedAt?: string | Date | null;
  packedAt?: string | Date | null;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  className?: string;
  quotationNumber?: string;
  shipmentNumber?: string;
}

export const ShipmentTimeline: React.FC<ShipmentTimelineProps> = ({
  steps,
  currentStatus,
  quotationStatus,
  hasApprovals,
  hasReservation,
  shipmentStatus,
  createdAt,
  approvedAt,
  reservedAt,
  packedAt,
  shippedAt,
  deliveredAt,
  className = "",
  quotationNumber,
  shipmentNumber,
}) => {
  const timelineSteps =
    steps && steps.length > 0
      ? steps
      : deriveFulfillmentLifecycleSteps({
          quotationStatus,
          hasApprovals,
          hasReservation,
          shipmentStatus: shipmentStatus || currentStatus,
          createdAt,
          approvedAt,
          reservedAt,
          packedAt,
          shippedAt,
          deliveredAt,
        });

  const getStageIcon = (stage: FulfillmentTimelineStage, status?: VerticalTimelineStep["status"]) => {
    if (status === "cancelled") {
      return <AlertCircle className="w-4 h-4" />;
    }
    switch (stage) {
      case "Draft":
        return <FileText className="w-4 h-4" />;
      case "Pending Approval":
        return <Clock className="w-4 h-4" />;
      case "Approved":
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
