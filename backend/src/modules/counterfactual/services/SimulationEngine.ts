/**
 * SimulationEngine
 *
 * Simulates proposed quotation adjustments entirely in-memory using the existing RuleEngine.
 *
 * Guarantees:
 * - Zero database writes / records modified.
 * - Complete isolation: cloned memory objects discarded after evaluation.
 * - Fault tolerance: individual candidate failures never crash the remaining batch.
 */

import type { RuleContext } from "../../rule-engine/engine/RuleContext.js";
import type { RuleEngine } from "../../rule-engine/engine/RuleEngine.js";
import { ApprovalLevel } from "../../rule-engine/interfaces/Rule.js";
import type { CandidateModification, SimulationChangeItem } from "../types/types.js";
import type { SimulationResult, SimulationResponse } from "../interfaces/interfaces.js";
import { applyModificationsToContext } from "../utils/clone.js";
import { CostEvaluator } from "./CostEvaluator.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("simulation-engine");

export class SimulationEngine {
  constructor(
    private readonly ruleEngine: RuleEngine,
    private readonly costEvaluator = new CostEvaluator(),
  ) {}

  /**
   * Simulates a candidate proposal against a base context without touching the database.
   *
   * @param baseContext Original quotation RuleContext.
   * @param candidate Modification candidate to simulate.
   * @returns SimulationResult if evaluation succeeds and passes business rules; otherwise null.
   */
  async simulateCandidate(
    baseContext: RuleContext,
    candidate: CandidateModification,
  ): Promise<SimulationResult | null> {
    const startTime = performance.now();
    try {
      // 1. Clone context and apply modifications
      const simulatedContext = applyModificationsToContext(baseContext, candidate.changes);

      // 2. Invoke Rule Engine in simulation mode (no trace persistence)
      const simulatedResult = await this.ruleEngine.evaluate(simulatedContext, {
        persistTrace: false,
      });

      // 3. Evaluate success: must be approved (no rule failures, not REJECT)
      const isApproved = simulatedResult.approved && simulatedResult.approvalLevel !== ApprovalLevel.REJECT;

      // 4. Calculate cost evaluation metrics
      const metrics = this.costEvaluator.evaluate(
        baseContext,
        simulatedContext,
        simulatedResult,
        candidate,
      );

      const execMs = Math.round((performance.now() - startTime) * 100) / 100;
      log.debug(
        {
          candidateId: candidate.id,
          candidateType: candidate.type,
          approved: isApproved,
          approvalLevel: simulatedResult.approvalLevel,
          riskScore: simulatedResult.overallRiskScore,
          execMs,
        },
        "Candidate simulation finished",
      );

      return {
        success: isApproved,
        candidate,
        simulatedResult,
        costScore: metrics.costScore,
        revenueImpact: metrics.revenueImpact,
        marginImpact: metrics.marginImpact,
        approvalProbability: metrics.approvalProbability,
        riskScore: metrics.riskScore,
        changedLinesCount: metrics.changedLinesCount,
        simulatedContext,
      };
    } catch (error) {
      log.warn(
        { candidateId: candidate.id, error },
        "Candidate simulation encountered an error; skipping candidate",
      );
      return null;
    }
  }

  /**
   * Executes an ad-hoc simulation directly from an API request.
   */
  async simulateDirect(
    baseContext: RuleContext,
    changes: SimulationChangeItem[],
  ): Promise<SimulationResponse> {
    const startTime = performance.now();

    // 1. Apply changes
    const simulatedContext = applyModificationsToContext(baseContext, changes);

    // 2. Evaluate with Rule Engine
    const ruleEngineResult = await this.ruleEngine.evaluate(simulatedContext, {
      persistTrace: false,
    });

    const execMs = Math.round(performance.now() - startTime);
    const revenueImpact =
      Math.round((simulatedContext.quotation.grandTotal - baseContext.quotation.grandTotal) * 100) / 100;
    const marginImpact =
      Math.round((simulatedContext.blendedMargin - baseContext.blendedMargin) * 10000) / 10000;

    return {
      quotationId: baseContext.quotation.id,
      simulatedDecision: ruleEngineResult.decision,
      simulatedApprovalLevel: ruleEngineResult.approvalLevel,
      simulatedRiskScore: ruleEngineResult.overallRiskScore,
      approved: ruleEngineResult.approved,
      ruleEngineResult,
      revenueImpact,
      marginImpact,
      executionTimeMs: execMs,
    };
  }
}
