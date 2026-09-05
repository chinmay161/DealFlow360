import { describe, it, expect } from "vitest";
import { CostEvaluator } from "../services/CostEvaluator.js";
import { ApprovalLevel, Severity, type RuleEngineResult } from "../../rule-engine/interfaces/Rule.js";
import { RecommendationType } from "../types/types.js";
import { mockDiscountViolatingContext } from "./helpers.js";
import { applyModificationsToContext } from "../utils/clone.js";

describe("CostEvaluator", () => {
  const evaluator = new CostEvaluator();

  const mockEngineResult: RuleEngineResult = {
    approved: true,
    approvalLevel: ApprovalLevel.AUTO_APPROVE,
    overallRiskScore: 15,
    decision: "Auto Approved",
    triggeredRules: [],
    failedRules: [],
    warnings: [],
    trace: [],
    recommendations: [],
  };

  it("evaluates revenue impact, customer impact, and cost score", () => {
    const base = mockDiscountViolatingContext();
    const candidate = {
      id: "cand-1",
      title: "Test Candidate",
      type: RecommendationType.DISCOUNT_ADJUSTMENT,
      changes: [
        {
          lineId: base.lines[0].id,
          field: "discountPct" as const,
          currentValue: base.lines[0].discountPct,
          recommendedValue: 0.10,
        },
      ],
      affectedLines: [base.lines[0].lineNumber],
    };

    const simulated = applyModificationsToContext(base, candidate.changes);
    const metrics = evaluator.evaluate(base, simulated, mockEngineResult, candidate);

    expect(metrics.revenueImpact).toBeGreaterThan(0);
    expect(metrics.changedLinesCount).toBe(1);
    expect(metrics.approvalProbability).toBeGreaterThan(0.8);
    expect(metrics.costScore).toBeGreaterThan(0);
  });

  it("assigns lower cost score to candidates with fewer modified lines", () => {
    const base = mockDiscountViolatingContext();

    const candidate1 = {
      id: "cand-1-line",
      title: "1 Line",
      type: RecommendationType.LINE_ITEM,
      changes: [
        {
          lineId: base.lines[0].id,
          field: "discountPct" as const,
          currentValue: 0.18,
          recommendedValue: 0.10,
        },
      ],
      affectedLines: [1],
    };

    const candidate2 = {
      id: "cand-2-lines",
      title: "2 Lines",
      type: RecommendationType.MULTI_LINE_OPTIMIZATION,
      changes: [
        {
          lineId: base.lines[0].id,
          field: "discountPct" as const,
          currentValue: 0.18,
          recommendedValue: 0.10,
        },
        {
          lineId: base.lines[1].id,
          field: "discountPct" as const,
          currentValue: 0.05,
          recommendedValue: 0.02,
        },
      ],
      affectedLines: [1, 2],
    };

    const sim1 = applyModificationsToContext(base, candidate1.changes);
    const sim2 = applyModificationsToContext(base, candidate2.changes);

    const metrics1 = evaluator.evaluate(base, sim1, mockEngineResult, candidate1);
    const metrics2 = evaluator.evaluate(base, sim2, mockEngineResult, candidate2);

    expect(metrics1.changedLinesCount).toBeLessThan(metrics2.changedLinesCount);
    expect(metrics1.costScore).toBeLessThan(metrics2.costScore);
  });

  it("calculates approval probability based on level and risk score", () => {
    expect(evaluator.calculateApprovalProbability(ApprovalLevel.AUTO_APPROVE, 10, true)).toBeGreaterThan(0.9);
    expect(evaluator.calculateApprovalProbability(ApprovalLevel.MANAGER, 30, true)).toBeGreaterThan(0.7);
    expect(evaluator.calculateApprovalProbability(ApprovalLevel.FINANCE, 50, true)).toBeGreaterThan(0.5);
    expect(evaluator.calculateApprovalProbability(ApprovalLevel.EXECUTIVE, 70, true)).toBeGreaterThan(0.3);
    expect(evaluator.calculateApprovalProbability(ApprovalLevel.REJECT, 80, false)).toBe(0.0);
  });
});
