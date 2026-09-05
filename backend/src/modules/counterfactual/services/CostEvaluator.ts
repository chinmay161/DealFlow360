/**
 * CostEvaluator
 *
 * Computes a normalized cost score for a simulated candidate modification.
 * Lower score indicates a better, less intrusive, and higher-priority recommendation.
 *
 * Factors evaluated:
 * - Revenue impact: magnitude of shift in total deal revenue
 * - Customer impact: economic burden placed on the customer (reduced discount / increased price)
 * - Changed line count: fewer modified lines is less disruptive to sales and operations
 * - Approval probability: likelihood of deal clearing without manual delays
 * - Resulting risk score: composite risk evaluated by the Rule Engine
 */

import type { RuleContext } from "../../rule-engine/engine/RuleContext.js";
import type { RuleEngineResult } from "../../rule-engine/interfaces/Rule.js";
import { ApprovalLevel } from "../../rule-engine/interfaces/Rule.js";
import type { CandidateModification } from "../types/types.js";

export interface CostEvaluationMetrics {
  costScore: number;
  revenueImpact: number;
  marginImpact: number;
  approvalProbability: number;
  riskScore: number;
  changedLinesCount: number;
  customerImpact: number;
}

export class CostEvaluator {
  /**
   * Evaluate cost metrics for a candidate simulation against the original context.
   */
  evaluate(
    originalContext: RuleContext,
    simulatedContext: RuleContext,
    simulatedResult: RuleEngineResult,
    candidate: CandidateModification,
  ): CostEvaluationMetrics {
    // 1. Revenue impact: simulated - original grand total
    const revenueImpact =
      Math.round((simulatedContext.quotation.grandTotal - originalContext.quotation.grandTotal) * 100) / 100;

    // 2. Margin impact: simulated - original blended margin
    const marginImpact =
      Math.round((simulatedContext.blendedMargin - originalContext.blendedMargin) * 10000) / 10000;

    // 3. Customer impact: direct increase in customer cost
    let customerImpact = 0;
    for (const simLine of simulatedContext.lines) {
      const origLine = originalContext.lines.find((l) => l.id === simLine.id);
      if (!origLine) continue;

      const origDiscountAmt = origLine.discount * origLine.quantity;
      const simDiscountAmt = simLine.discount * simLine.quantity;
      const discountLoss = Math.max(0, origDiscountAmt - simDiscountAmt);

      const priceIncrease = Math.max(0, (simLine.unitPrice - origLine.unitPrice) * simLine.quantity);
      customerImpact += discountLoss + priceIncrease;
    }
    customerImpact = Math.round(customerImpact * 100) / 100;

    // 4. Changed lines count
    const changedLinesCount = candidate.affectedLines.length;

    // 5. Approval probability
    const approvalProbability = this.calculateApprovalProbability(
      simulatedResult.approvalLevel,
      simulatedResult.overallRiskScore,
      simulatedResult.approved,
    );

    // 6. Resulting risk score
    const riskScore = simulatedResult.overallRiskScore;

    // 7. Composite Cost Score (lower = higher priority)
    // - Revenue impact magnitude normalized
    // - Customer impact normalized
    // - Each changed line adds a penalty (simpler recommendations preferred)
    // - Lower approval probability adds a heavy penalty
    // - Higher risk score adds moderate penalty
    const revenuePenalty = Math.abs(revenueImpact) * 0.005;
    const customerPenalty = customerImpact * 0.01;
    const linePenalty = changedLinesCount * 8;
    const approvalPenalty = (1 - approvalProbability) * 80;
    const riskPenalty = riskScore * 0.4;

    const costScore =
      Math.round((revenuePenalty + customerPenalty + linePenalty + approvalPenalty + riskPenalty) * 100) / 100;

    return {
      costScore,
      revenueImpact,
      marginImpact,
      approvalProbability,
      riskScore,
      changedLinesCount,
      customerImpact,
    };
  }

  /**
   * Derive approval probability from required approval level and risk score.
   */
  calculateApprovalProbability(
    level: ApprovalLevel,
    riskScore: number,
    approved: boolean,
  ): number {
    if (!approved || level === ApprovalLevel.REJECT) {
      return 0.0;
    }

    let baseProb = 0.5;
    switch (level) {
      case ApprovalLevel.AUTO_APPROVE:
        baseProb = 1.0;
        break;
      case ApprovalLevel.MANAGER:
        baseProb = 0.85;
        break;
      case ApprovalLevel.FINANCE:
        baseProb = 0.65;
        break;
      case ApprovalLevel.EXECUTIVE:
        baseProb = 0.45;
        break;
      default:
        baseProb = 0.5;
    }

    // Risk discount: a risk score of 0 reduces by 0%; risk score of 100 reduces by 30%
    const riskDiscount = 1 - (riskScore / 100) * 0.3;
    const finalProb = Math.min(1.0, Math.max(0.05, baseProb * riskDiscount));

    return Math.round(finalProb * 100) / 100;
  }
}
