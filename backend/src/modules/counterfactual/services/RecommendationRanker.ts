/**
 * RecommendationRanker
 *
 * Ranks simulated recommendations strictly in accordance with business priorities:
 * 1. Smallest financial impact (lowest absolute revenue disruption)
 * 2. Fewest quotation changes (minimal modified lines)
 * 3. Highest approval probability (fastest path to deal closure)
 * 4. Lowest risk score (healthiest deal posture)
 * 5. Lowest implementation cost (composite cost evaluation)
 */

import type { SimulationResult } from "../interfaces/interfaces.js";

export class RecommendationRanker {
  /**
   * Sorts simulation results deterministically by the 5 primary criteria.
   */
  rank(simulations: SimulationResult[]): SimulationResult[] {
    return [...simulations].sort((a, b) => {
      // 1. Smallest financial impact (absolute revenue delta)
      const finA = Math.abs(a.revenueImpact);
      const finB = Math.abs(b.revenueImpact);
      const finDiff = finA - finB;
      if (Math.abs(finDiff) >= 1.0) {
        return finDiff;
      }

      // 2. Fewest quotation changes
      if (a.changedLinesCount !== b.changedLinesCount) {
        return a.changedLinesCount - b.changedLinesCount;
      }

      // 3. Highest approval probability
      const probDiff = b.approvalProbability - a.approvalProbability;
      if (Math.abs(probDiff) >= 0.02) {
        return probDiff;
      }

      // 4. Lowest risk score
      const riskDiff = a.riskScore - b.riskScore;
      if (Math.abs(riskDiff) >= 0.5) {
        return riskDiff;
      }

      // 5. Lowest implementation cost score
      return a.costScore - b.costScore;
    });
  }

  /**
   * Compute a confidence score (0.0 to 1.0) for a ranked recommendation.
   */
  calculateConfidence(sim: SimulationResult): number {
    let base = sim.approvalProbability * 0.7;

    // Bonus for Auto Approve
    if (sim.simulatedResult.approvalLevel === "AUTO_APPROVE") {
      base += 0.2;
    } else if (sim.simulatedResult.approvalLevel === "MANAGER") {
      base += 0.1;
    }

    // Risk discount
    const riskFactor = Math.max(0, (100 - sim.riskScore) / 100) * 0.1;
    const finalConfidence = Math.min(0.99, Math.max(0.5, base + riskFactor));

    return Math.round(finalConfidence * 100) / 100;
  }
}
