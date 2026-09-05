"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { KanbanColumnDef } from "./lib/kanban-transitions";
import { SerializedQuotationListItem } from "@/lib/quotations";
import { KanbanCard } from "./KanbanCard";
import { formatCurrency } from "@/lib/currency";
import { Inbox } from "lucide-react";

interface KanbanColumnProps {
  column: KanbanColumnDef;
  quotations: SerializedQuotationListItem[];
  onOpenDecisionTrace: (q: SerializedQuotationListItem) => void;
  onOpenRecommendations: (q: SerializedQuotationListItem) => void;
  onOpenAuditHistory: (q: SerializedQuotationListItem) => void;
  onQuotationDeleted?: (id: string) => void;
  onQuotationDuplicated?: (newQuotationId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  quotations,
  onOpenDecisionTrace,
  onOpenRecommendations,
  onOpenAuditHistory,
  onQuotationDeleted,
  onQuotationDuplicated,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });

  const columnTotalValue = quotations.reduce((sum, q) => sum + (q.totalValue || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border transition-colors duration-200 min-w-[280px] sm:min-w-[310px] w-full max-w-[340px] shrink-0 ${
        isOver
          ? "bg-blue-50/60 border-primary ring-2 ring-primary/20 shadow-md"
          : "bg-slate-100/70 border-slate-200/80 shadow-xs"
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-200/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Status Color Dot / Pill */}
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${column.statusIndicatorColor}`}
          >
            {column.label}
          </span>
          <span className="px-1.5 py-0.2 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700 shadow-2xs">
            {quotations.length}
          </span>
        </div>

        {/* Aggregated Total Amount */}
        <span className="font-mono text-xs font-bold text-slate-600">
          {formatCurrency(columnTotalValue, "INR")}
        </span>
      </div>

      {/* Cards List Container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px]">
        {quotations.length === 0 ? (
          <div className="h-44 rounded-xl border border-dashed border-slate-300 bg-white/50 flex flex-col items-center justify-center p-4 text-center">
            <Inbox className="w-8 h-8 text-slate-300 mb-1.5" />
            <span className="text-xs font-semibold text-slate-600">No quotations</span>
            <p className="text-[10px] text-slate-400 mt-0.5 max-w-[180px]">
              Drop quotations here to transition state
            </p>
          </div>
        ) : (
          quotations.map((quote) => (
            <KanbanCard
              key={quote.id}
              quotation={quote}
              onOpenDecisionTrace={onOpenDecisionTrace}
              onOpenRecommendations={onOpenRecommendations}
              onOpenAuditHistory={onOpenAuditHistory}
              onQuotationDeleted={onQuotationDeleted}
              onQuotationDuplicated={onQuotationDuplicated}
            />
          ))
        )}
      </div>
    </div>
  );
};
