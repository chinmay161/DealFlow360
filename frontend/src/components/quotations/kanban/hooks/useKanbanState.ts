"use client";

import { useState, useMemo, useCallback } from "react";
import { SerializedQuotationListItem } from "@/lib/quotations";
import { KanbanFilterState } from "../KanbanControls";
import { mapStatusToColumnId } from "../lib/kanban-transitions";

const DEFAULT_FILTERS: KanbanFilterState = {
  search: "",
  status: "ALL",
  salesRep: "ALL",
  customerTier: "ALL",
  warehouse: "ALL",
  approvalLevel: "ALL",
  riskLevel: "ALL",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export function useKanbanState(initialQuotations: SerializedQuotationListItem[]) {
  const [quotations, setQuotations] = useState<SerializedQuotationListItem[]>(initialQuotations);
  const [filters, setFilters] = useState<KanbanFilterState>(DEFAULT_FILTERS);

  // Keep quotations synced with incoming initial prop if changed
  // (e.g. after router.refresh() or server reload)
  const syncQuotations = useCallback((newQuotes: SerializedQuotationListItem[]) => {
    setQuotations(newQuotes);
  }, []);

  const handleFilterChange = useCallback((key: keyof KanbanFilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Extract unique sales representatives for filter dropdown
  const salesReps = useMemo(() => {
    const reps = new Set<string>();
    for (const q of quotations) {
      if (q.owner?.name) reps.add(q.owner.name);
      else if (q.owner?.email) reps.add(q.owner.email.split("@")[0]);
    }
    return Array.from(reps).sort();
  }, [quotations]);

  // Filtered & Sorted Quotations
  const filteredQuotations = useMemo(() => {
    const term = filters.search.toLowerCase().trim();

    return quotations
      .filter((q) => {
        // Search
        if (term) {
          const matchQuote = q.quotationNumber.toLowerCase().includes(term);
          const matchCustomer = q.customer.name.toLowerCase().includes(term);
          const matchAcc = q.customer.externalAccountId?.toLowerCase().includes(term);
          const matchOwner =
            q.owner.name?.toLowerCase().includes(term) || q.owner.email.toLowerCase().includes(term);
          const matchStage = q.currentStage?.toLowerCase().includes(term);

          if (!matchQuote && !matchCustomer && !matchAcc && !matchOwner && !matchStage) {
            return false;
          }
        }

        // Status filter
        if (filters.status !== "ALL") {
          const colId = mapStatusToColumnId(q.status);
          if (colId !== filters.status && q.status !== filters.status) {
            return false;
          }
        }

        // Sales Rep filter
        if (filters.salesRep !== "ALL") {
          const ownerName = q.owner.name || q.owner.email.split("@")[0];
          if (ownerName !== filters.salesRep) {
            return false;
          }
        }

        // Customer Tier filter
        if (filters.customerTier !== "ALL") {
          if ((q.customer.tier || "").toUpperCase() !== filters.customerTier.toUpperCase()) {
            return false;
          }
        }

        // Approval Level filter
        if (filters.approvalLevel !== "ALL") {
          const risk = q.riskScore ?? 0;
          const val = q.totalValue || 0;
          const level = val > 1500000 || risk > 65 ? "FINANCE_DIRECTOR" : "SALES_MANAGER";
          if (level !== filters.approvalLevel) {
            return false;
          }
        }

        // Risk Level filter
        if (filters.riskLevel !== "ALL") {
          const risk = q.riskScore ?? 0;
          if (filters.riskLevel === "LOW" && risk >= 40) return false;
          if (filters.riskLevel === "MEDIUM" && (risk < 40 || risk >= 70)) return false;
          if (filters.riskLevel === "HIGH" && (risk < 70 || risk >= 85)) return false;
          if (filters.riskLevel === "CRITICAL" && risk < 85) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const orderMultiplier = filters.sortOrder === "asc" ? 1 : -1;

        if (filters.sortBy === "totalValue") {
          return ((a.totalValue || 0) - (b.totalValue || 0)) * orderMultiplier;
        }
        if (filters.sortBy === "riskScore") {
          return ((a.riskScore || 0) - (b.riskScore || 0)) * orderMultiplier;
        }
        if (filters.sortBy === "customerName") {
          return a.customer.name.localeCompare(b.customer.name) * orderMultiplier;
        }
        if (filters.sortBy === "priority") {
          const aPriority = (a.riskScore || 0) + (a.totalValue > 1000000 ? 50 : 0);
          const bPriority = (b.riskScore || 0) + (b.totalValue > 1000000 ? 50 : 0);
          return (aPriority - bPriority) * orderMultiplier;
        }

        // Default: createdAt
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return (aDate - bDate) * orderMultiplier;
      });
  }, [quotations, filters]);

  // Optimistic update handler for instant drag responsiveness
  const updateQuotationStatusOptimistically = useCallback(
    (quotationId: string, targetColumnId: string): { rollback: () => void } => {
      let previousQuotation: SerializedQuotationListItem | undefined;

      setQuotations((prev) => {
        previousQuotation = prev.find((q) => q.id === quotationId);
        if (!previousQuotation) return prev;

        return prev.map((q) => {
          if (q.id === quotationId) {
            // Map column ID to a valid QuotationStatus
            let newStatus = q.status;
            if (targetColumnId === "DRAFT") newStatus = "DRAFT" as any;
            else if (targetColumnId === "PENDING_APPROVAL") newStatus = "IN_REVIEW" as any;
            else if (targetColumnId === "APPROVED") newStatus = "APPROVED" as any;
            else if (targetColumnId === "REJECTED") newStatus = "REJECTED" as any;
            else if (targetColumnId === "EXPIRED") newStatus = "EXPIRED" as any;

            return {
              ...q,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            };
          }
          return q;
        });
      });

      // Return rollback function in case backend call fails
      return {
        rollback: () => {
          if (previousQuotation) {
            setQuotations((prev) =>
              prev.map((q) => (q.id === quotationId ? (previousQuotation as SerializedQuotationListItem) : q))
            );
          }
        },
      };
    },
    []
  );

  // Remove quotation after deletion
  const removeQuotation = useCallback((quotationId: string) => {
    setQuotations((prev) => prev.filter((q) => q.id !== quotationId));
  }, []);

  return {
    quotations,
    filteredQuotations,
    filters,
    salesReps,
    handleFilterChange,
    handleResetFilters,
    updateQuotationStatusOptimistically,
    removeQuotation,
    syncQuotations,
  };
}
