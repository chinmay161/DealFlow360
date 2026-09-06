"use client";

import React, { useState, useEffect } from "react";
import { Table, Kanban } from "lucide-react";
import { SerializedQuotationListItem } from "@/lib/quotations";
import { QuotationsListTable } from "./QuotationsListTable";
import { QuotationsKanbanView } from "./kanban/QuotationsKanbanView";

interface QuotationsViewManagerProps {
  quotations: SerializedQuotationListItem[];
  error?: string | null;
  initialSearch?: string;
  initialStatus?: string;
  initialRisk?: string;
}

export const QuotationsViewManager: React.FC<QuotationsViewManagerProps> = ({
  quotations,
  error,
  initialSearch,
  initialStatus,
  initialRisk,
}) => {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [isMounted, setIsMounted] = useState(false);

  // Restore saved view preference while the page is open
  useEffect(() => {
    setIsMounted(true);
    const savedView = sessionStorage.getItem("dealflow360_quotations_view");
    if (savedView === "table" || savedView === "kanban") {
      setViewMode(savedView);
    }
  }, []);

  const handleToggleView = (mode: "table" | "kanban") => {
    setViewMode(mode);
    try {
      sessionStorage.setItem("dealflow360_quotations_view", mode);
    } catch {
      // Ignore in restricted environments
    }
  };

  return (
    <div className="space-y-4">
      {/* Top View Toggle Segment */}
      <div className="flex items-center justify-between">
        {/* Toggle Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 border border-slate-300/80 shadow-inner">
          <button
            type="button"
            id="view-toggle-table"
            onClick={() => handleToggleView("table")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "table"
                ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>

          <button
            type="button"
            id="view-toggle-kanban"
            onClick={() => handleToggleView("kanban")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "kanban"
                ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban View</span>
          </button>
        </div>

        {/* View Mode indicator hint */}
        <span className="text-xs font-medium text-slate-500 font-mono hidden sm:inline-block">
          Mode: <strong className="text-slate-800">{viewMode === "kanban" ? "Agile Pipeline" : "Directory Table"}</strong>
        </span>
      </div>

      {/* Conditionally Render Table or Kanban View, or Error State */}
      {error || viewMode === "table" ? (
        <QuotationsListTable
          quotations={quotations}
          error={error}
          initialSearch={initialSearch}
          initialStatus={initialStatus}
          initialRisk={initialRisk}
        />
      ) : (
        <QuotationsKanbanView
          initialQuotations={quotations}
          initialSearch={initialSearch}
          initialStatus={initialStatus}
          initialRisk={initialRisk}
        />
      )}
    </div>
  );
};
