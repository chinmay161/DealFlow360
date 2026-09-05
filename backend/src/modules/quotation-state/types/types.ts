/**
 * Quotation State Machine — Core Domain Types
 *
 * Defines the complete quotation lifecycle states, transition matrix configs,
 * context shapes, and audit history models.
 */

export type RoleType = "SALES_REP" | "SALES_MANAGER" | "FINANCE_MANAGER" | "VP_SALES" | "ADMIN" | "LEGAL" | "OPERATIONS" | string;

/**
 * Complete set of quotation lifecycle states supported by the State Machine.
 * Future states can be appended here and added to the transition matrix.
 */
export enum QuotationState {
  Draft = "Draft",
  Submitted = "Submitted",
  PendingManager = "PendingManager",
  PendingFinance = "PendingFinance",
  Approved = "Approved",
  Rejected = "Rejected",
  ReturnedForRevision = "ReturnedForRevision",
  Reserved = "Reserved",
  Fulfilled = "Fulfilled",
  Cancelled = "Cancelled",
  Closed = "Closed",
}

/**
 * Case-insensitive normalizer for incoming state strings.
 * Maps e.g. "draft", "DRAFT", "Draft" -> QuotationState.Draft.
 */
export function normalizeState(stateStr: string): QuotationState | null {
  if (!stateStr) return null;
  const clean = stateStr.trim().toLowerCase().replace(/[\s_-]+/g, "");

  const lookup: Record<string, QuotationState> = {
    draft: QuotationState.Draft,
    submitted: QuotationState.Submitted,
    pendingmanager: QuotationState.PendingManager,
    pendingfinance: QuotationState.PendingFinance,
    approved: QuotationState.Approved,
    rejected: QuotationState.Rejected,
    returnedforrevision: QuotationState.ReturnedForRevision,
    reserved: QuotationState.Reserved,
    fulfilled: QuotationState.Fulfilled,
    cancelled: QuotationState.Cancelled,
    canceled: QuotationState.Cancelled,
    closed: QuotationState.Closed,
  };

  return lookup[clean] ?? null;
}

/**
 * Minimal actor representation for permission validation and state history.
 */
export interface ActorInfo {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: RoleType | string;
}

/**
 * Context provided to validator, workflow hooks, and executor during a transition.
 */
export interface TransitionContext {
  quotationId: string;
  currentState: QuotationState;
  targetState: QuotationState;
  actorId: string;
  actor?: ActorInfo;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Return shape produced after executing a state transition.
 */
export interface TransitionResult {
  success: boolean;
  quotationId: string;
  previousState: QuotationState;
  currentState: QuotationState;
  actorId: string;
  actor?: ActorInfo;
  timestamp: Date;
  reason?: string;
  message: string;
  executionTimeMs: number;
  workflowDetails?: Record<string, any>;
}

/**
 * Representation of an immutable entry in the quotation state history.
 */
export interface StateHistoryEntry {
  id: string;
  quotationId: string;
  previousState: QuotationState | string;
  nextState: QuotationState | string;
  actorId: string;
  actor?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: RoleType | string;
  };
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Definition of transition permissions and allowed target states from a source state.
 */
export interface StateTransitionConfig {
  allowedTargets: QuotationState[];
  allowedRoles?: (RoleType | string)[];
  description?: string;
  isTerminal?: boolean;
}

/**
 * Configurable state transition matrix.
 * Allows effortless addition of future states and allowed transitions.
 */
export const STATE_TRANSITIONS_CONFIG: Record<QuotationState, StateTransitionConfig> = {
  [QuotationState.Draft]: {
    allowedTargets: [QuotationState.Submitted, QuotationState.Cancelled],
    allowedRoles: ["SALES_REP", "ADMIN", "MANAGER"],
    description: "Initial quote creation and editing state",
  },
  [QuotationState.Submitted]: {
    allowedTargets: [
      QuotationState.PendingManager,
      QuotationState.PendingFinance,
      QuotationState.Approved,
      QuotationState.Rejected,
      QuotationState.Cancelled,
    ],
    allowedRoles: ["SALES_REP", "ADMIN", "MANAGER"],
    description: "Quotation submitted for review; triggers rule engine & routing",
  },
  [QuotationState.PendingManager]: {
    allowedTargets: [
      QuotationState.PendingFinance,
      QuotationState.Approved,
      QuotationState.Rejected,
      QuotationState.ReturnedForRevision,
      QuotationState.Cancelled,
    ],
    allowedRoles: ["MANAGER", "ADMIN"],
    description: "Pending Stage 1 managerial review and decision",
  },
  [QuotationState.PendingFinance]: {
    allowedTargets: [
      QuotationState.Approved,
      QuotationState.Rejected,
      QuotationState.ReturnedForRevision,
      QuotationState.Cancelled,
    ],
    allowedRoles: ["FINANCE", "ADMIN"],
    description: "Pending Stage 2 finance review and decision",
  },
  [QuotationState.Approved]: {
    allowedTargets: [QuotationState.Reserved, QuotationState.Cancelled],
    allowedRoles: ["ADMIN", "SALES_REP", "MANAGER", "FINANCE"],
    description: "Quotation formally approved; ready for inventory reservation",
  },
  [QuotationState.Rejected]: {
    allowedTargets: [QuotationState.ReturnedForRevision],
    allowedRoles: ["MANAGER", "FINANCE", "ADMIN", "SALES_REP"],
    description: "Quotation rejected; can only transition to ReturnedForRevision",
  },
  [QuotationState.ReturnedForRevision]: {
    allowedTargets: [QuotationState.Draft, QuotationState.Submitted, QuotationState.Cancelled],
    allowedRoles: ["SALES_REP", "ADMIN", "MANAGER"],
    description: "Quotation sent back for changes; sales rep can edit and resubmit",
  },
  [QuotationState.Reserved]: {
    allowedTargets: [QuotationState.Fulfilled, QuotationState.Cancelled],
    allowedRoles: ["ADMIN", "MANAGER", "SALES_REP"],
    description: "Inventory allocation confirmed; awaiting order fulfillment",
  },
  [QuotationState.Fulfilled]: {
    allowedTargets: [QuotationState.Closed],
    allowedRoles: ["ADMIN", "MANAGER"],
    description: "Commercial order dispatched and completed",
  },
  [QuotationState.Cancelled]: {
    allowedTargets: [],
    allowedRoles: ["ADMIN", "MANAGER", "SALES_REP"],
    description: "Quotation cancelled; terminal state",
    isTerminal: true,
  },
  [QuotationState.Closed]: {
    allowedTargets: [],
    allowedRoles: ["ADMIN"],
    description: "Lifecycle finalized; terminal state",
    isTerminal: true,
  },
};
