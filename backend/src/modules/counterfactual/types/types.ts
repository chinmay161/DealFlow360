/**
 * Counterfactual Engine — Domain Types
 */

import type { ApprovalLevel } from "../../rule-engine/interfaces/Rule.js";

/**
 * Supported recommendation archetypes.
 */
export enum RecommendationType {
  DISCOUNT_ADJUSTMENT = "DISCOUNT_ADJUSTMENT",
  PRICE_ADJUSTMENT = "PRICE_ADJUSTMENT",
  MARGIN_IMPROVEMENT = "MARGIN_IMPROVEMENT",
  CATEGORY_DISCOUNT = "CATEGORY_DISCOUNT",
  LINE_ITEM = "LINE_ITEM",
  MULTI_LINE_OPTIMIZATION = "MULTI_LINE_OPTIMIZATION",
}

/**
 * Change targeting an individual quotation line or property.
 */
export interface CandidateChange {
  /** Target quotation line UUID (if known) */
  lineId?: string;
  /** Target quotation line number (1-based display ordering) */
  lineNumber?: number;
  /** Product SKU for identification and clear explanation */
  sku?: string;
  /** Product human-readable name */
  productName?: string;
  /** Field being modified */
  field: "discountPct" | "unitPrice" | "discount";
  /** Current value before change */
  currentValue: number;
  /** Recommended/simulated value */
  recommendedValue: number;
}

/**
 * A synthesized modification proposal to be evaluated by the SimulationEngine.
 */
export interface CandidateModification {
  id: string;
  title: string;
  description?: string;
  type: RecommendationType;
  changes: CandidateChange[];
  affectedLines: Array<string | number>;
  /** Optional metadata about the generation rationale */
  metadata?: Record<string, unknown>;
}

/**
 * Simplified change item used in HTTP simulation requests.
 */
export interface SimulationChangeItem {
  lineId?: string;
  lineNumber?: number;
  sku?: string;
  field: "discountPct" | "unitPrice" | "discount";
  value: number;
}

export type { ApprovalLevel };
