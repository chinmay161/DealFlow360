/**
 * RecommendationGenerator
 *
 * Synthesizes candidate modifications across 6 primary archetypes:
 * 1. Discount Adjustment (single line discount reductions)
 * 2. Price Adjustment (selling price increases to recover margin)
 * 3. Margin Improvement (targeted elimination of margin-eroding discounts)
 * 4. Category-specific Discount (isolated to violating category lines)
 * 5. Line-item Recommendation (surgical single-product fix)
 * 6. Multi-line Optimization (balanced adjustments across top offending items)
 *
 * Does NOT evaluate rules or encode business policies — produces candidate proposals
 * for the SimulationEngine to evaluate and validate.
 */

import type { RuleContext, ContextQuotationLine } from "../../rule-engine/engine/RuleContext.js";
import type { RuleEngineResult } from "../../rule-engine/interfaces/Rule.js";
import { RecommendationType, type CandidateModification, type CandidateChange } from "../types/types.js";

export class RecommendationGenerator {
  /**
   * Generates candidate modification proposals based on quotation context and initial evaluation.
   */
  generateCandidates(
    context: RuleContext,
    initialResult: RuleEngineResult,
  ): CandidateModification[] {
    const candidates: CandidateModification[] = [];
    const seenSignatures = new Set<string>();

    const addCandidate = (cand: CandidateModification) => {
      if (cand.changes.length === 0) return;
      // Deduplicate by signature
      const sig = cand.changes
        .map((c) => `${c.lineId || c.lineNumber || c.sku}:${c.field}:${c.recommendedValue.toFixed(4)}`)
        .sort()
        .join("|");

      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        candidates.push(cand);
      }
    };

    const lines = context.lines;
    const { failedRules, triggeredRules, trace } = initialResult;

    // ── 1. Strategy: Discount Ceiling & Single Line-Item Recommendations ───────
    const discountCeilingRule = trace.find((r) => r.ruleId === "discount-ceiling");
    const tierCeiling = discountCeilingRule ? discountCeilingRule.threshold : 0.10;

    // Identify lines violating ceiling
    const ceilingViolators = lines.filter((l) => l.discountPct > tierCeiling);

    for (const line of ceilingViolators) {
      // 1A. Exact reduction to ceiling
      addCandidate({
        id: `discount-ceiling-${line.id}-${Math.round(tierCeiling * 100)}`,
        title: `Reduce ${line.product.name} discount to ${(tierCeiling * 100).toFixed(0)}%`,
        type: RecommendationType.DISCOUNT_ADJUSTMENT,
        changes: [
          {
            lineId: line.id,
            lineNumber: line.lineNumber,
            sku: line.product.sku,
            productName: line.product.name,
            field: "discountPct",
            currentValue: line.discountPct,
            recommendedValue: tierCeiling,
          },
        ],
        affectedLines: [line.lineNumber],
      });

      // 1B. Conservative reduction (1-2% below ceiling to guarantee compliance)
      const conservativeCeiling = Math.max(0, tierCeiling - 0.02);
      if (conservativeCeiling < tierCeiling) {
        addCandidate({
          id: `discount-ceiling-safe-${line.id}`,
          title: `Reduce ${line.product.name} discount to ${(conservativeCeiling * 100).toFixed(0)}%`,
          type: RecommendationType.LINE_ITEM,
          changes: [
            {
              lineId: line.id,
              lineNumber: line.lineNumber,
              sku: line.product.sku,
              productName: line.product.name,
              field: "discountPct",
              currentValue: line.discountPct,
              recommendedValue: conservativeCeiling,
            },
          ],
          affectedLines: [line.lineNumber],
        });
      }
    }

    // ── 2. Strategy: Category-Specific Discount Adjustments ────────────────────
    const categoryRule = trace.find((r) => r.ruleId === "category-discount");
    if (categoryRule && categoryRule.metadata?.violations) {
      const violations = categoryRule.metadata.violations as Array<{
        category: string;
        avgDiscountPct: number;
        ceiling: number;
      }>;

      for (const v of violations) {
        const catLines = lines.filter(
          (l) => l.product.categoryName.toLowerCase() === v.category.toLowerCase(),
        );

        // 2A. Adjust all lines in this category to the category ceiling
        const catChanges: CandidateChange[] = catLines
          .filter((l) => l.discountPct > v.ceiling)
          .map((l) => ({
            lineId: l.id,
            lineNumber: l.lineNumber,
            sku: l.product.sku,
            productName: l.product.name,
            field: "discountPct" as const,
            currentValue: l.discountPct,
            recommendedValue: v.ceiling,
          }));

        if (catChanges.length > 0) {
          addCandidate({
            id: `category-adjust-${v.category.toLowerCase().replace(/\s+/g, "-")}`,
            title: `Align ${v.category} discounts to ${(v.ceiling * 100).toFixed(0)}% limit`,
            type: RecommendationType.CATEGORY_DISCOUNT,
            changes: catChanges,
            affectedLines: catChanges.map((c) => c.lineNumber!),
          });
        }

        // 2B. Adjust only the worst single line in the category
        const worstCatLine = catLines.reduce<ContextQuotationLine | null>(
          (worst, cur) => (!worst || cur.discountPct > worst.discountPct ? cur : worst),
          null,
        );

        if (worstCatLine && worstCatLine.discountPct > v.ceiling) {
          addCandidate({
            id: `category-worst-line-${worstCatLine.id}`,
            title: `Reduce highest ${v.category} discount on ${worstCatLine.product.name}`,
            type: RecommendationType.CATEGORY_DISCOUNT,
            changes: [
              {
                lineId: worstCatLine.id,
                lineNumber: worstCatLine.lineNumber,
                sku: worstCatLine.product.sku,
                productName: worstCatLine.product.name,
                field: "discountPct",
                currentValue: worstCatLine.discountPct,
                recommendedValue: v.ceiling,
              },
            ],
            affectedLines: [worstCatLine.lineNumber],
          });
        }
      }
    }

    // ── 3. Strategy: Margin Improvement & Price Adjustments ────────────────────
    const marginRule = trace.find((r) => r.ruleId === "margin");
    const minMargin = marginRule ? marginRule.threshold : 0.15;

    // Identify lines with margin below minMargin
    const lowMarginLines = lines
      .map((l) => {
        const netRev = l.unitPrice * l.quantity - l.discount * l.quantity;
        const lineCost = l.product.costPrice * l.quantity;
        const marginPct = netRev > 0 ? (netRev - lineCost) / netRev : 0;
        return { line: l, marginPct, netRev, lineCost };
      })
      .filter((item) => item.marginPct < minMargin)
      .sort((a, b) => a.marginPct - b.marginPct);

    for (const item of lowMarginLines.slice(0, 3)) {
      const l = item.line;

      // 3A. Margin Improvement via discount reduction
      if (l.discountPct > 0) {
        addCandidate({
          id: `margin-eliminate-discount-${l.id}`,
          title: `Remove discount on ${l.product.name} to restore margin`,
          type: RecommendationType.MARGIN_IMPROVEMENT,
          changes: [
            {
              lineId: l.id,
              lineNumber: l.lineNumber,
              sku: l.product.sku,
              productName: l.product.name,
              field: "discountPct",
              currentValue: l.discountPct,
              recommendedValue: 0,
            },
          ],
          affectedLines: [l.lineNumber],
        });
      }

      // 3B. Price Adjustment: calculate required price to hit minMargin
      // Target Net Price = Cost / (1 - minMargin)
      if (l.product.costPrice > 0) {
        const targetNetUnitPrice = l.product.costPrice / Math.max(0.01, 1 - minMargin);
        // If keeping current discount, base unit price = targetNetUnitPrice / (1 - discountPct)
        const requiredUnitPrice =
          l.discountPct < 1 ? targetNetUnitPrice / (1 - l.discountPct) : targetNetUnitPrice;

        if (requiredUnitPrice > l.unitPrice) {
          const roundedPrice = Math.ceil(requiredUnitPrice);
          addCandidate({
            id: `price-adjust-${l.id}-${roundedPrice}`,
            title: `Increase ${l.product.name} price to recover ${(minMargin * 100).toFixed(0)}% margin`,
            type: RecommendationType.PRICE_ADJUSTMENT,
            changes: [
              {
                lineId: l.id,
                lineNumber: l.lineNumber,
                sku: l.product.sku,
                productName: l.product.name,
                field: "unitPrice",
                currentValue: l.unitPrice,
                recommendedValue: roundedPrice,
              },
            ],
            affectedLines: [l.lineNumber],
          });
        }
      }
    }

    // ── 4. Strategy: Multi-line Optimization ──────────────────────────────────
    // When multiple lines have high discounts, adjust top 2-3 lines together
    const sortedDiscountLines = [...lines]
      .filter((l) => l.discountPct > 0)
      .sort((a, b) => b.discountPct - a.discountPct);

    if (sortedDiscountLines.length >= 2) {
      const top2 = sortedDiscountLines.slice(0, 2);
      addCandidate({
        id: `multi-line-top2-${top2.map((l) => l.id).join("-")}`,
        title: `Multi-line discount reduction on ${top2.map((l) => l.product.name).join(" and ")}`,
        type: RecommendationType.MULTI_LINE_OPTIMIZATION,
        changes: top2.map((l) => ({
          lineId: l.id,
          lineNumber: l.lineNumber,
          sku: l.product.sku,
          productName: l.product.name,
          field: "discountPct" as const,
          currentValue: l.discountPct,
          recommendedValue: Math.max(0, Math.min(tierCeiling, l.discountPct - 0.05)),
        })),
        affectedLines: top2.map((l) => l.lineNumber),
      });

      if (sortedDiscountLines.length >= 3) {
        const top3 = sortedDiscountLines.slice(0, 3);
        addCandidate({
          id: `multi-line-top3-${top3.map((l) => l.id).join("-")}`,
          title: `Optimized adjustments across top 3 discounted items`,
          type: RecommendationType.MULTI_LINE_OPTIMIZATION,
          changes: top3.map((l) => ({
            lineId: l.id,
            lineNumber: l.lineNumber,
            sku: l.product.sku,
            productName: l.product.name,
            field: "discountPct" as const,
            currentValue: l.discountPct,
            recommendedValue: Math.max(0, Math.min(tierCeiling, l.discountPct - 0.04)),
          })),
          affectedLines: top3.map((l) => l.lineNumber),
        });
      }
    }

    // ── 5. Strategy: Blended Risk Score Mitigation ────────────────────────────
    // If approval level is not AUTO_APPROVE, scale down blended discount by 20%
    if (sortedDiscountLines.length > 0) {
      const proportionalChanges: CandidateChange[] = sortedDiscountLines.slice(0, 4).map((l) => ({
        lineId: l.id,
        lineNumber: l.lineNumber,
        sku: l.product.sku,
        productName: l.product.name,
        field: "discountPct" as const,
        currentValue: l.discountPct,
        recommendedValue: Math.round(l.discountPct * 0.7 * 100) / 100, // 30% reduction
      }));

      addCandidate({
        id: "multi-line-proportional-discount-trim",
        title: "Proportional discount reduction to achieve Auto-Approval",
        type: RecommendationType.MULTI_LINE_OPTIMIZATION,
        changes: proportionalChanges,
        affectedLines: proportionalChanges.map((c) => c.lineNumber!),
      });
    }

    return candidates;
  }
}
