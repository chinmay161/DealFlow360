/**
 * RecommendationFormatter
 *
 * Converts candidate simulations into human-friendly, professional recommendation models.
 * Includes natural language descriptions, formatted financial impacts, and decision context.
 */

import type { SimulationResult, Recommendation } from "../interfaces/interfaces.js";
import { ApprovalWorkflowService } from "../../approval-routing/services/ApprovalWorkflowService.js";
import type { CandidateChange } from "../types/types.js";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export class RecommendationFormatter {
  private readonly workflowService = new ApprovalWorkflowService();

  /**
   * Formats a ranked simulation result into a public Recommendation DTO.
   */
  format(
    sim: SimulationResult,
    priority: number,
    confidence: number,
    currency = "USD",
  ): Recommendation {
    const symbol = CURRENCY_SYMBOLS[currency] ?? (currency ? `${currency} ` : "$");
    const title = this.buildTitle(sim.candidate.changes);
    const description = this.buildDescription(sim, symbol);
    const currentValues: Record<string, unknown> = {};
    const recommendedValues: Record<string, unknown> = {};

    for (const change of sim.candidate.changes) {
      const key = change.sku || change.lineId || `line_${change.lineNumber}`;
      currentValues[key] = {
        [change.field]: change.currentValue,
      };
      recommendedValues[key] = {
        [change.field]: change.recommendedValue,
      };
    }

    const expectedDecisionText = this.formatExpectedDecision(sim);

    return {
      id: sim.candidate.id,
      title,
      description,
      type: sim.candidate.type,
      affectedLines: sim.candidate.affectedLines,
      changes: sim.candidate.changes,
      currentValues,
      recommendedValues,
      expectedDecision: expectedDecisionText,
      expectedApprovalLevel: sim.simulatedResult.approvalLevel,
      expectedRiskScore: sim.simulatedResult.overallRiskScore,
      estimatedRevenueImpact: sim.revenueImpact,
      estimatedMarginImpact: sim.marginImpact,
      confidence,
      priority,
    };
  }

  /**
   * Generates a concise, actionable title for the recommendation.
   */
  private buildTitle(changes: CandidateChange[]): string {
    if (changes.length === 1) {
      const c = changes[0];
      const target = c.productName || c.sku || `Line ${c.lineNumber || 1}`;
      if (c.field === "discountPct") {
        return `Reduce ${target} discount from ${(c.currentValue * 100).toFixed(0)}% to ${(c.recommendedValue * 100).toFixed(0)}%`;
      }
      if (c.field === "unitPrice") {
        return `Adjust ${target} selling price to ${Math.round(c.recommendedValue).toLocaleString()}`;
      }
      return `Adjust ${target} ${c.field}`;
    }

    if (changes.length === 2) {
      const t1 = changes[0].productName || changes[0].sku || "Item 1";
      const t2 = changes[1].productName || changes[1].sku || "Item 2";
      return `Optimize discounts on ${t1} and ${t2}`;
    }

    return `Multi-line optimization across ${changes.length} quotation items`;
  }

  /**
   * Generates natural language description matching the user specification.
   */
  private buildDescription(sim: SimulationResult, symbol: string): string {
    const lines: string[] = [];

    // Change actions
    for (const c of sim.candidate.changes) {
      const target = c.productName || c.sku || `Line #${c.lineNumber || 1}`;
      if (c.field === "discountPct") {
        lines.push(
          `Reduce ${target} discount from ${(c.currentValue * 100).toFixed(0)}% to ${(c.recommendedValue * 100).toFixed(0)}%.`,
        );
      } else if (c.field === "unitPrice") {
        lines.push(
          `Increase ${target} selling price from ${symbol}${c.currentValue.toLocaleString()} to ${symbol}${c.recommendedValue.toLocaleString()}.`,
        );
      } else {
        lines.push(`Adjust ${c.field} on ${target} from ${c.currentValue} to ${c.recommendedValue}.`);
      }
    }

    lines.push("");
    lines.push("Expected Result:");
    lines.push(this.formatExpectedDecision(sim));

    lines.push("");
    lines.push("Risk Score:");
    lines.push(`${sim.simulatedResult.overallRiskScore}`);

    lines.push("");
    lines.push("Estimated Revenue Impact:");
    const revFormatted = this.formatCurrencyDiff(sim.revenueImpact, symbol);
    lines.push(revFormatted);

    // Add margin context if changed
    if (Math.abs(sim.marginImpact) > 0.0001) {
      const marginPct = (sim.marginImpact * 100).toFixed(1);
      const sign = sim.marginImpact > 0 ? "+" : "";
      lines.push(`Margin Impact: ${sign}${marginPct}%`);
    }

    return lines.join("\n");
  }

  private formatCurrencyDiff(amount: number, symbol: string): string {
    if (Math.abs(amount) < 0.01) {
      return `${symbol}0`;
    }
    const formattedNum = Math.abs(Math.round(amount)).toLocaleString();
    if (amount < 0) {
      return `−${symbol}${formattedNum}`;
    }
    return `+${symbol}${formattedNum}`;
  }

  private formatExpectedDecision(sim: SimulationResult): string {
    const level = sim.simulatedResult.approvalLevel;
    if (level === "AUTO_APPROVE") {
      return "Auto Approval";
    }
    const totalStages = this.workflowService.getTotalStages(level);
    if (totalStages > 0) {
      return `${level.charAt(0) + level.slice(1).toLowerCase()} Approval (${totalStages} stage${totalStages > 1 ? "s" : ""})`;
    }
    return `${level.charAt(0) + level.slice(1).toLowerCase()} Approval`;
  }
}
