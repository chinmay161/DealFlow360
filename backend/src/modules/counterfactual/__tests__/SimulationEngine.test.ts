import { describe, it, expect, vi, beforeEach } from "vitest";
import { SimulationEngine } from "../services/SimulationEngine.js";
import { RuleEngine } from "../../rule-engine/engine/RuleEngine.js";
import { ApprovalLevel, Severity, type RuleEngineResult } from "../../rule-engine/interfaces/Rule.js";
import { RecommendationType } from "../types/types.js";
import { mockDiscountViolatingContext } from "./helpers.js";
import { InvalidSimulationError } from "../utils/errors.js";

describe("SimulationEngine", () => {
  let mockRuleEngine: RuleEngine;
  let simulationEngine: SimulationEngine;

  const successfulResult: RuleEngineResult = {
    approved: true,
    approvalLevel: ApprovalLevel.AUTO_APPROVE,
    overallRiskScore: 18,
    decision: "Quotation auto-approved. All rules passed.",
    triggeredRules: [],
    failedRules: [],
    warnings: [],
    trace: [],
    recommendations: [],
  };

  beforeEach(() => {
    mockRuleEngine = {
      evaluate: vi.fn().mockResolvedValue(successfulResult),
    } as unknown as RuleEngine;

    simulationEngine = new SimulationEngine(mockRuleEngine);
  });

  it("evaluates a candidate in-memory with persistTrace: false without modifying base context", async () => {
    const baseContext = mockDiscountViolatingContext();
    const originalDiscount = baseContext.lines[0].discountPct;

    const candidate = {
      id: "cand-1",
      title: "Reduce Laptop discount",
      type: RecommendationType.DISCOUNT_ADJUSTMENT,
      changes: [
        {
          lineId: baseContext.lines[0].id,
          field: "discountPct" as const,
          currentValue: originalDiscount,
          recommendedValue: 0.10,
        },
      ],
      affectedLines: [baseContext.lines[0].lineNumber],
    };

    const simResult = await simulationEngine.simulateCandidate(baseContext, candidate);

    expect(simResult).not.toBeNull();
    expect(simResult?.success).toBe(true);
    expect(simResult?.simulatedResult.approvalLevel).toBe(ApprovalLevel.AUTO_APPROVE);
    expect(baseContext.lines[0].discountPct).toBe(originalDiscount); // base untouched

    // Ensure RuleEngine was called with persistTrace: false
    expect(mockRuleEngine.evaluate).toHaveBeenCalledWith(
      expect.anything(),
      { persistTrace: false },
    );
  });

  it("handles candidate evaluation errors gracefully and returns null", async () => {
    const baseContext = mockDiscountViolatingContext();
    (mockRuleEngine.evaluate as any).mockRejectedValueOnce(new Error("Rule failure"));

    const candidate = {
      id: "cand-error",
      title: "Failing candidate",
      type: RecommendationType.DISCOUNT_ADJUSTMENT,
      changes: [
        {
          lineId: baseContext.lines[0].id,
          field: "discountPct" as const,
          currentValue: 0.18,
          recommendedValue: 0.10,
        },
      ],
      affectedLines: [1],
    };

    const result = await simulationEngine.simulateCandidate(baseContext, candidate);
    expect(result).toBeNull();
  });

  it("executes direct ad-hoc simulation via simulateDirect", async () => {
    const baseContext = mockDiscountViolatingContext();

    const response = await simulationEngine.simulateDirect(baseContext, [
      {
        lineId: baseContext.lines[0].id,
        field: "discountPct",
        value: 0.10,
      },
    ]);

    expect(response.approved).toBe(true);
    expect(response.simulatedApprovalLevel).toBe(ApprovalLevel.AUTO_APPROVE);
    expect(response.simulatedRiskScore).toBe(18);
  });

  it("throws InvalidSimulationError when direct simulation targets an invalid line", async () => {
    const baseContext = mockDiscountViolatingContext();

    await expect(
      simulationEngine.simulateDirect(baseContext, [
        {
          lineId: "invalid-line-id",
          field: "discountPct",
          value: 0.10,
        },
      ]),
    ).rejects.toThrow(InvalidSimulationError);
  });
});
