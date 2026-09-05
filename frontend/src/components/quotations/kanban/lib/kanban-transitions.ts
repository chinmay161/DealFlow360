export interface KanbanColumnDef {
  id: string; // Column identifier (e.g., 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED')
  label: string;
  statusIndicatorColor: string; // Tailored color badge
  accentBorderColor: string;
  bgColor: string;
  allowedTargets: string[]; // State machine allowed target column IDs
}

export const CANONICAL_KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    id: "DRAFT",
    label: "Draft",
    statusIndicatorColor: "bg-slate-400 text-slate-800 border-slate-300",
    accentBorderColor: "border-l-slate-400",
    bgColor: "bg-slate-50",
    allowedTargets: ["PENDING_APPROVAL", "EXPIRED"],
  },
  {
    id: "PENDING_APPROVAL",
    label: "Pending Approval",
    statusIndicatorColor: "bg-amber-100 text-amber-900 border-amber-300",
    accentBorderColor: "border-l-amber-500",
    bgColor: "bg-amber-50/40",
    allowedTargets: ["APPROVED", "REJECTED", "EXPIRED"],
  },
  {
    id: "APPROVED",
    label: "Approved",
    statusIndicatorColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    accentBorderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-50/40",
    allowedTargets: ["EXPIRED"],
  },
  {
    id: "REJECTED",
    label: "Rejected",
    statusIndicatorColor: "bg-rose-100 text-rose-900 border-rose-300",
    accentBorderColor: "border-l-rose-500",
    bgColor: "bg-rose-50/40",
    allowedTargets: ["DRAFT"],
  },
  {
    id: "EXPIRED",
    label: "Expired",
    statusIndicatorColor: "bg-slate-200 text-slate-700 border-slate-300",
    accentBorderColor: "border-l-slate-600",
    bgColor: "bg-slate-100/50",
    allowedTargets: [],
  },
];

/**
 * Maps any raw database status (e.g. IN_REVIEW, SENT, ACCEPTED, CANCELLED) to a Kanban Column ID.
 */
export function mapStatusToColumnId(rawStatus: string | null | undefined): string {
  if (!rawStatus) return "DRAFT";
  const s = rawStatus.toUpperCase();

  if (s === "DRAFT" || s === "DRAFTING") {
    return "DRAFT";
  }
  if (s === "PENDING_APPROVAL" || s === "IN_REVIEW" || s === "SUBMITTED" || s.includes("PENDING")) {
    return "PENDING_APPROVAL";
  }
  if (s === "APPROVED" || s === "ACCEPTED" || s === "SENT" || s === "RESERVED" || s === "FULFILLED") {
    return "APPROVED";
  }
  if (s === "REJECTED" || s === "RETURNED_FOR_REVISION") {
    return "REJECTED";
  }
  if (s === "EXPIRED" || s === "CANCELLED" || s === "CLOSED") {
    return "EXPIRED";
  }

  return s;
}

/**
 * Validates whether a state machine transition between two Kanban columns is permissible.
 */
export function isStateTransitionAllowed(
  fromColumnId: string,
  toColumnId: string
): { allowed: boolean; reason?: string } {
  if (fromColumnId === toColumnId) {
    return { allowed: true };
  }

  const columnDef = CANONICAL_KANBAN_COLUMNS.find((c) => c.id === fromColumnId);

  if (!columnDef) {
    // If unknown column, permit drop to any standard state
    return { allowed: true };
  }

  if (columnDef.allowedTargets.includes(toColumnId)) {
    return { allowed: true };
  }

  // Generate specific error explanations
  if (fromColumnId === "APPROVED" && toColumnId === "DRAFT") {
    return {
      allowed: false,
      reason: "Approved commercial quotations cannot be reverted directly to Draft. Create a duplicate or revision instead.",
    };
  }
  if (fromColumnId === "REJECTED" && toColumnId === "APPROVED") {
    return {
      allowed: false,
      reason: "Rejected quotations must return to Draft for commercial revision before approval.",
    };
  }
  if (fromColumnId === "EXPIRED") {
    return {
      allowed: false,
      reason: "Expired or Cancelled quotations are in a terminal state and cannot transition.",
    };
  }

  return {
    allowed: false,
    reason: `Quotation State Machine forbids transitioning from ${columnDef.label} directly to ${
      CANONICAL_KANBAN_COLUMNS.find((c) => c.id === toColumnId)?.label || toColumnId
    }.`,
  };
}

/**
 * Calls existing backend quotation transition API.
 */
export async function executeQuotationTransition(
  quotationId: string,
  targetColumnId: string,
  reason?: string
): Promise<{ success: boolean; newState: string; message?: string }> {
  // Map column ID to target state label expected by transition API
  let targetState = "Draft";
  if (targetColumnId === "PENDING_APPROVAL") targetState = "Pending Approval";
  else if (targetColumnId === "APPROVED") targetState = "Approved";
  else if (targetColumnId === "REJECTED") targetState = "Rejected";
  else if (targetColumnId === "EXPIRED") targetState = "Expired";

  const response = await fetch(`/api/quotations/${encodeURIComponent(quotationId)}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetState,
      reason: reason || `Transitioned via Kanban board drag-and-drop to ${targetState}`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to execute quotation state transition");
  }

  return response.json();
}
