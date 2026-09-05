import { describe, it, expect } from "vitest";
import { RecommendationRanker } from "../services/RecommendationRanker.js";
import { ApprovalLevel } from "../../rule-engine/interfaces/Rule.js";
import { RecommendationType } from "../types/types.js";
import type { SimulationResult } from "../interfaces/interfaces.js";
import { mockDiscountViolatingContext } from "./helpers.js";

describe("RecommendationRanker", () => {
  const ranker = new RecommendationRanker();
  const baseContext = mockDiscountViolatingContext();

  function makeMockSim(overrides: Partial<SimulationResult> = {}): SimulationResult {
    return {
      success: true,
      candidate: {
        id: "cand-test",
        title: "Test",
        type: RecommendationType.DISCOUNT_ADJUSTMENT,
        changes: [],
        affectedLines: [1],
      },
      simulatedResult: {
        approved: true,
        approvalLevel: ApprovalLevel.AUTO_APPROVE,
        overallRiskScore: 20,
        decision: "Auto Approved",
        triggeredRules: [],
        failedRules: [],
        warnings: [],
        trace: [],
        recommendations: [],
      },
      costScore: 50,
      revenueImpact: 1000,
      marginImpact: 0.05,
      approvalProbability: 0.9,
      riskScore: 20,
      changedLinesCount: 1,
      simulatedContext: baseContext,
      ...overrides,
    };
  }

  it("ranks by smallest financial impact first", () => {
    const highImpact = makeMockSim({ revenueImpact: 5000 });
    const lowImpact = makeMockSim({ revenueImpact: 500 });

    const ranked = ranker.rank([highImpact, lowImpact]);
    expect(ranked[0]).toBe(lowImpact);
    expect(ranked[1]).toBe(highImpact);
  });

  it("ranks by fewest quotation changes when financial impact is similar", () => {
    const manyLines = makeMockSim({
      revenueImpact: 1000,
      changedLinesCount: 3,
    });
    const fewLines = makeMockSim({
      revenueImpact: 1000,
      changedLinesCount: 1,
    });

    const ranked = ranker.rank([manyLines, fewLines]);
    expect(ranked[0]).toBe(fewLines);
  });

  it("ranks by highest approval probability when changes are equal", () => {
    const lowerProb = makeMockSim({
      revenueImpact: 1000,
      changedLinesCount: 1,
      approvalProbability: 0.70,
    });
    const higherProb = makeMockSim({
      revenueImpact: 1000,
      changedLinesCount: 1,
      approvalProbability: 0.95,
    });

    const ranked = ranker.rank([lowerProb, higherProb]);
    expect(ranked[0]).toBe(higherProb);
  });

  it("ranks by lowest risk score when probability is equal", () => {
    const highRisk = makeMockSim({
      revenueImpact: 1000,
      changedLinesCount: 1,
      approvalProbability: 0.90,
      riskScore: 45,
    });
    const lowRisk = makeMockSim({
      revenueImpact: 1000,
      changedLinesCount: 1,
      approvalProbability: 0.90,
      riskScore: 15,
    });

    const ranked = ranker.rank([highRisk, lowRisk]);
    expect(ranked[0]).toBe(lowRisk);
  });

  it("calculates confidence score between 0.5 and 0.99", () => {
    const sim = makeMockSim();
    const confidence = ranker.calculateConfidence(sim);

    expect(confidence).toBeGreaterThanOrEqual(0.5);
    expect(confidence).toBeLessThanOrEqual(0.99);
  });
});
