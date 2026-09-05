/**
 * CounterfactualEngine
 *
 * Primary orchestrator for counterfactual reasoning in DealFlow360.
 * Analyzes rejected or approval-pending quotations and generates the minimal set
 * of modifications that satisfy all business rules.
 *
 * Public Service API:
 *   const recommendations = await counterfactualEngine.generateRecommendations(quotationId);
 *   const simulation = await counterfactualEngine.simulate(quotationId, changes);
 */

import type { PrismaClient } from "@prisma/client";
import { RuleEngine } from "../../rule-engine/engine/RuleEngine.js";
import { buildRuleContext } from "../../rule-engine/engine/RuleContext.js";
import { ApprovalLevel } from "../../rule-engine/interfaces/Rule.js";
import { SimulationEngine } from "./SimulationEngine.js";
import { RecommendationGenerator } from "./RecommendationGenerator.js";
import { RecommendationRanker } from "./RecommendationRanker.js";
import { CostEvaluator } from "./CostEvaluator.js";
import { RecommendationFormatter } from "./RecommendationFormatter.js";
import type {
  GenerateRecommendationsResponse,
  SimulationResponse,
  Recommendation,
} from "../interfaces/interfaces.js";
import type { SimulationChangeItem } from "../types/types.js";
import { QuotationNotFoundError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("counterfactual-engine");

export class CounterfactualEngine {
  private readonly ruleEngine: RuleEngine;
  private readonly simulationEngine: SimulationEngine;
  private readonly recommendationGenerator: RecommendationGenerator;
  private readonly recommendationRanker: RecommendationRanker;
  private readonly costEvaluator: CostEvaluator;
  private readonly recommendationFormatter: RecommendationFormatter;

  constructor(
    private readonly prisma: PrismaClient,
    customRuleEngine?: RuleEngine,
    customSimulationEngine?: SimulationEngine,
    customGenerator?: RecommendationGenerator,
    customRanker?: RecommendationRanker,
    customCostEvaluator?: CostEvaluator,
    customFormatter?: RecommendationFormatter,
  ) {
    this.ruleEngine = customRuleEngine ?? new RuleEngine(prisma);
    this.costEvaluator = customCostEvaluator ?? new CostEvaluator();
    this.simulationEngine =
      customSimulationEngine ?? new SimulationEngine(this.ruleEngine, this.costEvaluator);
    this.recommendationGenerator = customGenerator ?? new RecommendationGenerator();
    this.recommendationRanker = customRanker ?? new RecommendationRanker();
    this.recommendationFormatter = customFormatter ?? new RecommendationFormatter();
  }

  /**
   * Generates ranked, formatted counterfactual recommendations for a quotation.
   *
   * @param quotationId Target quotation UUID.
   * @returns GenerateRecommendationsResponse containing recommendations and current decision.
   * @throws QuotationNotFoundError if quotation does not exist.
   */
  async generateRecommendations(quotationId: string): Promise<GenerateRecommendationsResponse> {
    const startTime = performance.now();
    log.info({ quotationId }, "Initiating counterfactual recommendation analysis");

    // 1. Load base quotation context
    let baseContext;
    try {
      baseContext = await buildRuleContext(this.prisma, quotationId);
    } catch (err) {
      log.warn({ quotationId, error: err }, "Failed to load quotation for counterfactual analysis");
      throw new QuotationNotFoundError(quotationId);
    }

    // 2. Evaluate current state with Rule Engine
    const initialResult = await this.ruleEngine.evaluate(baseContext, { persistTrace: false });

    // 3. If already approved without manual intervention: return "No recommendations"
    if (initialResult.approved && initialResult.approvalLevel === ApprovalLevel.AUTO_APPROVE) {
      const execMs = Math.round((performance.now() - startTime) * 100) / 100;
      log.info(
        { quotationId, decision: initialResult.decision, execMs },
        "Quotation is already auto-approved; returning no recommendations",
      );

      return {
        quotationId,
        currentDecision: initialResult.decision,
        recommendations: [],
        simulationsCount: 0,
        executionTimeMs: execMs,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 4. Generate candidate modifications
    const candidates = this.recommendationGenerator.generateCandidates(baseContext, initialResult);
    log.debug({ quotationId, candidateCount: candidates.length }, "Candidate modifications generated");

    // 5. Simulate each candidate in-memory
    const simulationPromises = candidates.map((cand) =>
      this.simulationEngine.simulateCandidate(baseContext, cand),
    );

    const simulationResults = await Promise.all(simulationPromises);

    // 6. Collect successful simulations
    const successfulSimulations = simulationResults.filter(
      (sim): sim is NonNullable<typeof sim> => sim !== null && sim.success,
    );

    // 7. Rank recommendations
    const rankedSimulations = this.recommendationRanker.rank(successfulSimulations);

    // Take top 5 recommendations
    const topSimulations = rankedSimulations.slice(0, 5);

    // 8. Format recommendations
    const recommendations: Recommendation[] = topSimulations.map((sim, index) => {
      const priority = index + 1;
      const confidence = this.recommendationRanker.calculateConfidence(sim);
      return this.recommendationFormatter.format(
        sim,
        priority,
        confidence,
        baseContext.quotation.currency,
      );
    });

    const execMs = Math.round((performance.now() - startTime) * 100) / 100;
    const topRankingScore = topSimulations.length > 0 ? topSimulations[0].costScore : 0;

    // Structured Pino log matching task specification
    log.info(
      {
        quotationId,
        simulationCount: candidates.length,
        successfulRecommendations: recommendations.length,
        executionTimeMs: execMs,
        rankingScore: topRankingScore,
      },
      "Counterfactual recommendation generation complete",
    );

    return {
      quotationId,
      currentDecision: initialResult.decision,
      recommendations,
      simulationsCount: candidates.length,
      executionTimeMs: execMs,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Simulates an arbitrary set of changes against a quotation.
   *
   * @param quotationId Target quotation UUID.
   * @param changes Array of change items to apply.
   * @returns SimulationResponse containing simulated Rule Engine output.
   * @throws QuotationNotFoundError if quotation does not exist.
   * @throws InvalidSimulationError if changes cannot be applied.
   */
  async simulate(
    quotationId: string,
    changes: SimulationChangeItem[],
  ): Promise<SimulationResponse> {
    log.info({ quotationId, changeCount: changes?.length ?? 0 }, "Executing direct simulation");

    let baseContext;
    try {
      baseContext = await buildRuleContext(this.prisma, quotationId);
    } catch (err) {
      log.warn({ quotationId, error: err }, "Quotation not found for direct simulation");
      throw new QuotationNotFoundError(quotationId);
    }

    return this.simulationEngine.simulateDirect(baseContext, changes);
  }
}
