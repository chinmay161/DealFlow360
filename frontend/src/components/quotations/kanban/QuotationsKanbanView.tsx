"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SerializedQuotationListItem } from "@/lib/quotations";
import { useToast } from "@/components/providers/ToastProvider";
import { KanbanMetricsBar } from "./KanbanMetricsBar";
import { KanbanControls } from "./KanbanControls";
import { KanbanBoard } from "./KanbanBoard";
import { KanbanCardSkeleton } from "./KanbanCardSkeleton";
import { DecisionTraceDrawer } from "./Drawers/DecisionTraceDrawer";
import { RecommendationsDrawer } from "./Drawers/RecommendationsDrawer";
import { AuditHistoryDrawer } from "./Drawers/AuditHistoryDrawer";
import { useKanbanState } from "./hooks/useKanbanState";
import {
  executeQuotationTransition,
  CANONICAL_KANBAN_COLUMNS,
} from "./lib/kanban-transitions";

interface QuotationsKanbanViewProps {
  initialQuotations: SerializedQuotationListItem[];
  initialSearch?: string;
  initialStatus?: string;
  initialRisk?: string;
}

export const QuotationsKanbanView: React.FC<QuotationsKanbanViewProps> = ({
  initialQuotations,
  initialSearch,
  initialStatus,
  initialRisk,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  // Drawers state
  const [decisionTraceQuote, setDecisionTraceQuote] = useState<SerializedQuotationListItem | null>(null);
  const [recommendationsQuote, setRecommendationsQuote] = useState<SerializedQuotationListItem | null>(null);
  const [auditHistoryQuote, setAuditHistoryQuote] = useState<SerializedQuotationListItem | null>(null);

  // Kanban state management
  const {
    quotations,
    filteredQuotations,
    filters,
    salesReps,
    handleFilterChange,
    handleResetFilters,
    updateQuotationStatusOptimistically,
    removeQuotation,
    syncQuotations,
  } = useKanbanState(initialQuotations);

  // Apply initial url parameters if provided
  useEffect(() => {
    if (initialSearch) handleFilterChange("search", initialSearch);
    if (initialStatus) handleFilterChange("status", initialStatus.toUpperCase());
    if (initialRisk) handleFilterChange("riskLevel", initialRisk.toUpperCase());
  }, [initialSearch, initialStatus, initialRisk, handleFilterChange]);

  // React Query Cache integration
  const { data: cachedQuotes, isLoading } = useQuery({
    queryKey: ["quotations", "kanban"],
    queryFn: async () => {
      // Re-fetch via API if query is explicitly invalidated
      const res = await fetch("/api/quotations?pageSize=100");
      if (!res.ok) throw new Error("Failed to fetch quotations");
      const json = await res.json();
      return json.quotations as SerializedQuotationListItem[];
    },
    initialData: initialQuotations,
    staleTime: 60_000, // Keeps cache fresh without refetching on every drag
  });

  // Sync state when React Query cache changes (e.g. after invalidation)
  useEffect(() => {
    if (cachedQuotes && cachedQuotes.length > 0) {
      syncQuotations(cachedQuotes);
    }
  }, [cachedQuotes, syncQuotations]);

  // State Machine transition handler with Optimistic Updates & Graceful Rollback
  const handleTransitionQuotation = async (quotationId: string, targetColumnId: string) => {
    const targetColDef = CANONICAL_KANBAN_COLUMNS.find((c) => c.id === targetColumnId);
    const targetLabel = targetColDef?.label || targetColumnId;

    // 1. Optimistically update UI immediately (Never refetch whole board)
    const { rollback } = updateQuotationStatusOptimistically(quotationId, targetColumnId);

    try {
      // 2. Execute transition via Quotation State Machine API
      const result = await executeQuotationTransition(quotationId, targetColumnId);

      // 3. Update React Query cache directly without refetching entire board
      queryClient.setQueryData<SerializedQuotationListItem[]>(["quotations", "kanban"], (old) => {
        if (!old) return old;
        return old.map((q) =>
          q.id === quotationId ? { ...q, status: result.newState as any, updatedAt: new Date().toISOString() } : q
        );
      });

      success("State Transition Approved", `Quotation transitioned to ${targetLabel}.`);
    } catch (err: any) {
      // 4. Gracefully rollback on failure
      rollback();
      error(
        "Transition Failed",
        err?.message || "Backend rejected state machine transition. Card restored to original column."
      );
    }
  };

  // Quick action callbacks
  const handleQuotationDeleted = (id: string) => {
    removeQuotation(id);
    queryClient.setQueryData<SerializedQuotationListItem[]>(["quotations", "kanban"], (old) =>
      old ? old.filter((q) => q.id !== id) : []
    );
  };

  const handleQuotationDuplicated = () => {
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* 1. Executive Metrics Banner */}
      <KanbanMetricsBar quotations={quotations} />

      {/* 2. Search, Filters & Sorting Controls */}
      <KanbanControls
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        salesReps={salesReps}
        totalMatches={filteredQuotations.length}
        totalQuotations={quotations.length}
      />

      {/* 3. Kanban Board or Skeleton Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((colIdx) => (
            <div key={colIdx} className="space-y-3 bg-slate-100/70 p-3 rounded-2xl border border-slate-200">
              <div className="h-6 w-24 bg-slate-200 rounded" />
              <KanbanCardSkeleton />
              <KanbanCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          quotations={filteredQuotations}
          onTransitionQuotation={handleTransitionQuotation}
          onOpenDecisionTrace={(q) => setDecisionTraceQuote(q)}
          onOpenRecommendations={(q) => setRecommendationsQuote(q)}
          onOpenAuditHistory={(q) => setAuditHistoryQuote(q)}
          onQuotationDeleted={handleQuotationDeleted}
          onQuotationDuplicated={handleQuotationDuplicated}
        />
      )}

      {/* 4. Slide-over Decision Trace Drawer */}
      <DecisionTraceDrawer
        quotationId={decisionTraceQuote?.id ?? null}
        quotationNumber={decisionTraceQuote?.quotationNumber ?? null}
        isOpen={Boolean(decisionTraceQuote)}
        onClose={() => setDecisionTraceQuote(null)}
      />

      {/* 5. Slide-over Counterfactual Recommendations Drawer */}
      <RecommendationsDrawer
        quotationId={recommendationsQuote?.id ?? null}
        quotationNumber={recommendationsQuote?.quotationNumber ?? null}
        isOpen={Boolean(recommendationsQuote)}
        onClose={() => setRecommendationsQuote(null)}
        onApplied={() => {
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
          router.refresh();
        }}
      />

      {/* 6. Slide-over State Machine Audit History Drawer */}
      <AuditHistoryDrawer
        quotationId={auditHistoryQuote?.id ?? null}
        quotationNumber={auditHistoryQuote?.quotationNumber ?? null}
        isOpen={Boolean(auditHistoryQuote)}
        onClose={() => setAuditHistoryQuote(null)}
      />
    </div>
  );
};
