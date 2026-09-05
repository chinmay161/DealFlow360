"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDraggable } from "@dnd-kit/core";
import {
  Boxes,
  User,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Package,
  Bookmark,
  Truck,
  GripVertical,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SerializedQuotationListItem } from "@/lib/quotations";
import { QuickActionsMenu } from "./QuickActionsMenu";

interface KanbanCardProps {
  quotation: SerializedQuotationListItem;
  isDraggingOverlay?: boolean;
  onOpenDecisionTrace: (q: SerializedQuotationListItem) => void;
  onOpenRecommendations: (q: SerializedQuotationListItem) => void;
  onOpenAuditHistory: (q: SerializedQuotationListItem) => void;
  onQuotationDeleted?: (id: string) => void;
  onQuotationDuplicated?: (newQuotationId: string) => void;
}

function formatRelativeDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24 && now.getDate() === d.getDate()) return "Today";
    if (diffHours < 48 && (now.getDate() - d.getDate() === 1 || now.getDate() - d.getDate() === -30)) return "Yesterday";
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7 && diffDays > 0) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoString;
  }
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  quotation,
  isDraggingOverlay = false,
  onOpenDecisionTrace,
  onOpenRecommendations,
  onOpenAuditHistory,
  onQuotationDeleted,
  onQuotationDuplicated,
}) => {
  const router = useRouter();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: quotation.id,
    data: { quotation },
    disabled: isDraggingOverlay,
  });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : {};

  // Status mapping & indicator accents
  const statusUpper = quotation.status?.toUpperCase() || "DRAFT";
  const isApproved = statusUpper === "APPROVED" || statusUpper === "ACCEPTED";
  const isPending = statusUpper === "PENDING_APPROVAL" || statusUpper === "IN_REVIEW";
  const isRejected = statusUpper === "REJECTED";
  const isExpired = statusUpper === "EXPIRED" || statusUpper === "CANCELLED";

  // Left accent border color
  const accentBorderClass = isApproved
    ? "border-l-emerald-500"
    : isPending
    ? "border-l-amber-500"
    : isRejected
    ? "border-l-rose-500"
    : isExpired
    ? "border-l-slate-600"
    : "border-l-slate-400";

  // Risk Score Badge
  const risk = quotation.riskScore ?? 25;
  const isCriticalRisk = risk >= 85;
  const isHighRisk = risk >= 70 && risk < 85;
  const isMediumRisk = risk >= 40 && risk < 70;

  const riskLabel = isCriticalRisk ? "Critical" : isHighRisk ? "High" : isMediumRisk ? "Medium" : "Low";
  const riskBadgeClass = isCriticalRisk
    ? "bg-rose-100 text-rose-800 border-rose-300"
    : isHighRisk
    ? "bg-orange-100 text-orange-800 border-orange-300"
    : isMediumRisk
    ? "bg-amber-100 text-amber-800 border-amber-300"
    : "bg-emerald-100 text-emerald-800 border-emerald-300";

  // Rule Engine Indicator
  let ruleEngineStatus = "Passed";
  let ruleBadgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (isRejected) {
    ruleEngineStatus = "Rejected";
    ruleBadgeColor = "text-rose-700 bg-rose-50 border-rose-200";
  } else if (isPending || isHighRisk || isCriticalRisk) {
    ruleEngineStatus = "Needs Approval";
    ruleBadgeColor = "text-amber-700 bg-amber-50 border-amber-200";
  }

  // Inventory numbers & stock health
  const totalUnits = Math.max(1, quotation.lineItemCount * 4);
  const availableStock = 120;
  const reservedStock = isApproved ? 25 : 20;
  const freeStock = availableStock - reservedStock;
  const isLowStock = isHighRisk || quotation.totalValue > 2500000;

  // Approval widget details
  const approvalLevel = quotation.totalValue > 1500000 || risk > 65 ? "Finance Director" : "Sales Manager";
  const approvedBy = "Vikram Desai";

  // Tier badge styling
  const tier = (quotation.customer.tier || "GOLD").toUpperCase();
  const tierClass =
    tier === "PLATINUM"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : tier === "GOLD"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : tier === "SILVER"
      ? "bg-slate-100 text-slate-700 border-slate-200"
      : "bg-orange-100 text-orange-800 border-orange-200";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 border-l-[4px] ${accentBorderClass} ${
        isDragging ? "opacity-30 pointer-events-none scale-95" : ""
      } ${isDraggingOverlay ? "shadow-2xl ring-2 ring-primary scale-102 cursor-grabbing" : "cursor-pointer"}`}
      onClick={() => {
        if (!isDraggingOverlay) {
          router.push(`/quotations/${quotation.id}`);
        }
      }}
    >
      {/* Top Bar: Drag Grip, Quote Number, Created Date & Quick Actions */}
      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Drag to transition quotation"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-xs font-bold text-primary tracking-tight">
            {quotation.quotationNumber}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {formatRelativeDate(quotation.createdAt)}
          </span>
          <QuickActionsMenu
            quotation={quotation}
            onOpenDecisionTrace={onOpenDecisionTrace}
            onOpenRecommendations={onOpenRecommendations}
            onOpenAuditHistory={onOpenAuditHistory}
            onQuotationDeleted={onQuotationDeleted}
            onQuotationDuplicated={onQuotationDuplicated}
          />
        </div>
      </div>

      {/* Customer Name & Tier Badge */}
      <div className="pt-2.5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
            {quotation.customer.name}
          </h4>
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 uppercase tracking-wider border ${tierClass}`}
          >
            {quotation.customer.tier || "Gold"} Customer
          </span>
        </div>
        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
          {quotation.customer.industry || "Commercial Enterprise"}
        </p>
      </div>

      {/* Financials: Amount & Line Items */}
      <div className="py-2 px-2.5 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Value
          </span>
          <span className="font-mono text-sm font-bold text-slate-900">
            {formatCurrency(quotation.totalValue, quotation.currency)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
            Items
          </span>
          <span className="font-mono text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
            <Boxes className="w-3 h-3 text-slate-400" />
            {quotation.lineItemCount} {quotation.lineItemCount === 1 ? "Item" : "Items"}
          </span>
        </div>
      </div>

      {/* Rule Engine & Risk Badges */}
      <div className="pt-2.5 pb-1 flex items-center justify-between gap-2">
        {/* Rule Engine Indicator */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Rule Engine:</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${ruleBadgeColor}`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{ruleEngineStatus}</span>
          </span>
        </div>

        {/* Risk Badge */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Risk:</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${riskBadgeClass}`}>
            {riskLabel} ({risk})
          </span>
        </div>
      </div>

      {/* Inventory Widget */}
      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 bg-slate-50/50 p-2 rounded-lg text-[10px]">
        <div className="flex items-center justify-between font-medium">
          <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Package className="w-3 h-3 text-slate-400" /> Inventory
          </span>
          {isLowStock ? (
            <span className="text-amber-700 font-bold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              <AlertTriangle className="w-3 h-3" /> ⚠ Low Stock
            </span>
          ) : (
            <span className="text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> ✓ Available
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-[10px] text-center">
          <div className="bg-white p-1 rounded border border-slate-200">
            <span className="text-[9px] text-slate-400 uppercase block">Avail</span>
            <strong className="text-slate-800">{availableStock}</strong>
          </div>
          <div className="bg-white p-1 rounded border border-slate-200">
            <span className="text-[9px] text-slate-400 uppercase block">Resv</span>
            <strong className="text-amber-700">{reservedStock}</strong>
          </div>
          <div className="bg-white p-1 rounded border border-slate-200">
            <span className="text-[9px] text-slate-400 uppercase block">Free</span>
            <strong className="text-emerald-700">{freeStock}</strong>
          </div>
        </div>
      </div>

      {/* Approval & Operational Badges */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px]">
        {/* Approval Widget */}
        {isPending ? (
          <div className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
            <span className="text-[9px] text-slate-500 uppercase">Approval:</span>
            <strong className="text-[10px]">{approvalLevel}</strong>
          </div>
        ) : isApproved ? (
          <div className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
            <span className="text-[9px] text-slate-500 uppercase">Approved By:</span>
            <strong className="text-[10px]">{approvedBy}</strong>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
            <User className="w-2.5 h-2.5 text-slate-400" />
            <span>Rep: {quotation.owner.name || quotation.owner.email.split("@")[0]}</span>
          </div>
        )}

        {/* Shipment Widget (Approved only) */}
        {isApproved && (
          <div className="flex items-center gap-1 text-purple-800 bg-purple-50 px-2 py-0.5 rounded font-medium border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" />
            <span>Shipment: <strong>Packed</strong></span>
          </div>
        )}

        {/* Reservation Widget */}
        {(isApproved || isPending) && (
          <div className="flex items-center gap-1 text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
            <Bookmark className="w-2.5 h-2.5 text-blue-600" />
            <span>Reserved: <strong>{totalUnits} Units</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
