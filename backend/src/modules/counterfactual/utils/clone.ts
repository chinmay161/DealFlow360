/**
 * Counterfactual Engine — Context Cloning and In-Memory Recomputation Utility
 *
 * Provides fast, zero-database in-memory manipulation of RuleContext for simulations.
 */

import type {
  RuleContext,
  ContextQuotationLine,
  ContextQuotation,
} from "../../rule-engine/engine/RuleContext.js";
import type { CandidateChange, SimulationChangeItem } from "../types/types.js";
import { InvalidSimulationError } from "./errors.js";

/**
 * Deep-clones a RuleContext in-memory.
 * Clones the quotation and quotation lines; retains references to immutable static policies.
 */
export function cloneRuleContext(context: RuleContext): RuleContext {
  const clonedLines: ContextQuotationLine[] = context.lines.map((l) => ({
    ...l,
    product: { ...l.product },
  }));

  const clonedQuotation: ContextQuotation = {
    ...context.quotation,
  };

  return {
    quotation: Object.freeze(clonedQuotation),
    lines: Object.freeze(clonedLines.map((l) => Object.freeze(l))),
    customer: context.customer,
    discountPolicies: context.discountPolicies,
    approvalRules: context.approvalRules,
    stockLevels: context.stockLevels,
    categories: context.categories,
    blendedDiscountPct: context.blendedDiscountPct,
    blendedMargin: context.blendedMargin,
  };
}

/**
 * Applies candidate modifications to a cloned context and recomputes all aggregates.
 * Throws InvalidSimulationError if target lines are not found or parameters are invalid.
 */
export function applyModificationsToContext(
  baseContext: RuleContext,
  changes: Array<CandidateChange | SimulationChangeItem>,
): RuleContext {
  if (!changes || changes.length === 0) {
    return cloneRuleContext(baseContext);
  }

  // Deep clone lines and quotation
  const clonedLines: ContextQuotationLine[] = baseContext.lines.map((l) => ({
    ...l,
    product: { ...l.product },
  }));

  for (const change of changes) {
    // Find matching line by lineId, lineNumber, or SKU
    const targetLine = clonedLines.find((l) => {
      if (change.lineId && l.id === change.lineId) return true;
      if (change.lineNumber !== undefined && l.lineNumber === change.lineNumber) return true;
      if (change.sku && l.product.sku === change.sku) return true;
      return false;
    });

    if (!targetLine) {
      const identifier = change.lineId || `line #${change.lineNumber}` || change.sku || "unknown";
      throw new InvalidSimulationError(`Target quotation line "${identifier}" not found in quotation.`, {
        change,
      });
    }

    const val = "recommendedValue" in change ? change.recommendedValue : change.value;

    if (typeof val !== "number" || isNaN(val)) {
      throw new InvalidSimulationError(`Invalid numerical value for field "${change.field}": ${val}`, {
        change,
      });
    }

    if (change.field === "discountPct") {
      if (val < 0 || val > 1) {
        throw new InvalidSimulationError(`Discount percentage must be between 0 and 1 (inclusive). Got: ${val}`, {
          change,
        });
      }
      targetLine.discountPct = val;
      // Derived discount amount per unit
      targetLine.discount = targetLine.unitPrice * val;
    } else if (change.field === "unitPrice") {
      if (val < 0) {
        throw new InvalidSimulationError(`Unit price cannot be negative. Got: ${val}`, {
          change,
        });
      }
      targetLine.unitPrice = val;
      targetLine.discount = val * targetLine.discountPct;
    } else if (change.field === "discount") {
      if (val < 0) {
        throw new InvalidSimulationError(`Discount amount cannot be negative. Got: ${val}`, {
          change,
        });
      }
      targetLine.discount = val;
      targetLine.discountPct = targetLine.unitPrice > 0 ? Math.min(1, val / targetLine.unitPrice) : 0;
    } else {
      throw new InvalidSimulationError(`Unsupported change field: "${(change as any).field}"`, {
        change,
      });
    }

    // Recompute line subtotal, margin, and tax
    const totalLinePrice = targetLine.unitPrice * targetLine.quantity;
    const totalDiscount = targetLine.discount * targetLine.quantity;
    const netRevenue = Math.max(0, totalLinePrice - totalDiscount);
    const totalCost = targetLine.product.costPrice * targetLine.quantity;

    targetLine.subtotal = netRevenue;
    targetLine.taxAmount = netRevenue * targetLine.product.taxRate;
    targetLine.margin = netRevenue - totalCost;
  }

  // Recompute quotation totals
  const totalRevenue = clonedLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const totalDiscount = clonedLines.reduce((s, l) => s + l.discount * l.quantity, 0);
  const totalTax = clonedLines.reduce((s, l) => s + l.taxAmount, 0);
  const totalSubtotal = clonedLines.reduce((s, l) => s + l.subtotal, 0);
  const grandTotal = totalSubtotal + totalTax;

  const blendedDiscountPct =
    totalRevenue > 0
      ? clonedLines.reduce((s, l) => s + l.discountPct * (l.unitPrice * l.quantity), 0) / totalRevenue
      : 0;

  const blendedMargin =
    totalRevenue > 0
      ? clonedLines.reduce((s, l) => {
          const cost = l.product.costPrice * l.quantity;
          const rev = l.unitPrice * l.quantity;
          return s + (rev > 0 ? (rev - cost) / rev : 0) * rev;
        }, 0) / totalRevenue
      : 0;

  const clonedQuotation: ContextQuotation = {
    ...baseContext.quotation,
    subtotal: Math.round(totalRevenue * 10000) / 10000,
    discountTotal: Math.round(totalDiscount * 10000) / 10000,
    taxTotal: Math.round(totalTax * 10000) / 10000,
    grandTotal: Math.round(grandTotal * 10000) / 10000,
  };

  const categories = [...new Set(clonedLines.map((l) => l.product.categoryName))];

  return Object.freeze({
    quotation: Object.freeze(clonedQuotation),
    lines: Object.freeze(clonedLines.map((l) => Object.freeze(l))),
    customer: baseContext.customer,
    discountPolicies: baseContext.discountPolicies,
    approvalRules: baseContext.approvalRules,
    stockLevels: baseContext.stockLevels,
    categories: Object.freeze(categories),
    blendedDiscountPct,
    blendedMargin,
  });
}
