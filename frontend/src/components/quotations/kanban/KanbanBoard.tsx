"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SerializedQuotationListItem } from "@/lib/quotations";
import {
  KanbanColumnDef,
  CANONICAL_KANBAN_COLUMNS,
  mapStatusToColumnId,
  isStateTransitionAllowed,
} from "./lib/kanban-transitions";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useToast } from "@/components/providers/ToastProvider";

interface KanbanBoardProps {
  quotations: SerializedQuotationListItem[];
  onTransitionQuotation: (quotationId: string, targetColumnId: string) => Promise<void>;
  onOpenDecisionTrace: (q: SerializedQuotationListItem) => void;
  onOpenRecommendations: (q: SerializedQuotationListItem) => void;
  onOpenAuditHistory: (q: SerializedQuotationListItem) => void;
  onQuotationDeleted?: (id: string) => void;
  onQuotationDuplicated?: (newQuotationId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  quotations,
  onTransitionQuotation,
  onOpenDecisionTrace,
  onOpenRecommendations,
  onOpenAuditHistory,
  onQuotationDeleted,
  onQuotationDuplicated,
}) => {
  const { warning } = useToast();
  const [activeQuotation, setActiveQuotation] = useState<SerializedQuotationListItem | null>(null);
  const [activeMobileColumn, setActiveMobileColumn] = useState<string>("DRAFT");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement to start drag, avoiding accidental drags on click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Automatically discover any statuses from backend beyond canonical ones
  const activeStatuses = Array.from(new Set(quotations.map((q) => mapStatusToColumnId(q.status))));
  const columns: KanbanColumnDef[] = [...CANONICAL_KANBAN_COLUMNS];

  for (const status of activeStatuses) {
    if (!columns.some((c) => c.id === status)) {
      columns.push({
        id: status,
        label: status.replace(/_/g, " "),
        statusIndicatorColor: "bg-purple-100 text-purple-800 border-purple-300",
        accentBorderColor: "border-l-purple-500",
        bgColor: "bg-purple-50/40",
        allowedTargets: ["APPROVED", "REJECTED", "EXPIRED"],
      });
    }
  }

  // Partition quotations by column
  const columnQuotationsMap: Record<string, SerializedQuotationListItem[]> = {};
  for (const col of columns) {
    columnQuotationsMap[col.id] = [];
  }
  for (const quote of quotations) {
    const colId = mapStatusToColumnId(quote.status);
    if (!columnQuotationsMap[colId]) {
      columnQuotationsMap[colId] = [];
    }
    columnQuotationsMap[colId].push(quote);
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const quote = quotations.find((q) => q.id === active.id);
    if (quote) {
      setActiveQuotation(quote);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveQuotation(null);

    if (!over) return;

    const quotationId = String(active.id);
    const draggedQuote = quotations.find((q) => q.id === quotationId);
    if (!draggedQuote) return;

    const sourceColumnId = mapStatusToColumnId(draggedQuote.status);
    const targetColumnId = String(over.id);

    // If dropped in the same column, do nothing
    if (sourceColumnId === targetColumnId) {
      return;
    }

    // Verify business rules / state machine transition validity
    const check = isStateTransitionAllowed(sourceColumnId, targetColumnId);
    if (!check.allowed) {
      warning("State Machine Constraint", check.reason);
      return;
    }

    // Execute state transition
    await onTransitionQuotation(quotationId, targetColumnId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Mobile Tab Navigator (Small screens only) */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200">
        {columns.map((col) => {
          const count = columnQuotationsMap[col.id]?.length || 0;
          const isActive = activeMobileColumn === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveMobileColumn(col.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{col.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop & Tablet Multi-Column Container */}
      <div className="hidden md:flex items-start gap-4 overflow-x-auto pb-6 pt-1">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            quotations={columnQuotationsMap[col.id] || []}
            onOpenDecisionTrace={onOpenDecisionTrace}
            onOpenRecommendations={onOpenRecommendations}
            onOpenAuditHistory={onOpenAuditHistory}
            onQuotationDeleted={onQuotationDeleted}
            onQuotationDuplicated={onQuotationDuplicated}
          />
        ))}
      </div>

      {/* Mobile Single-Column View */}
      <div className="flex md:hidden pt-2">
        {columns
          .filter((col) => col.id === activeMobileColumn)
          .map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              quotations={columnQuotationsMap[col.id] || []}
              onOpenDecisionTrace={onOpenDecisionTrace}
              onOpenRecommendations={onOpenRecommendations}
              onOpenAuditHistory={onOpenAuditHistory}
              onQuotationDeleted={onQuotationDeleted}
              onQuotationDuplicated={onQuotationDuplicated}
            />
          ))}
      </div>

      {/* Drag Overlay with visual feedback */}
      <DragOverlay dropAnimation={null}>
        {activeQuotation ? (
          <KanbanCard
            quotation={activeQuotation}
            isDraggingOverlay
            onOpenDecisionTrace={onOpenDecisionTrace}
            onOpenRecommendations={onOpenRecommendations}
            onOpenAuditHistory={onOpenAuditHistory}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
