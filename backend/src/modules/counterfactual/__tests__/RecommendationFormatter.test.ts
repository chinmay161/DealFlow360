import { describe, it, expect } from "vitest";
import { RecommendationFormatter } from "../services/RecommendationFormatter.js";
import { ApprovalLevel } from "../../rule-engine/interfaces/Rule.js";
import { RecommendationType } from "../types/types.js";
import type { SimulationResult } from "../interfaces/interfaces.js";
import { mockDiscountViolatingContext } from "./helpers.js";

describe("RecommendationFormatter", () => {
  const formatter = new RecommendationFormatter();
  const baseContext = mockDiscountViolatingContext();

  const mockSim: SimulationResult = {
    success: true,
    candidate: {
      id: "cand-laptop-12",
      title: "Reduce Laptop discount",
      type: RecommendationType.DISCOUNT_ADJUSTMENT,
      changes: [
        {
          lineId: "line-laptop",
          lineNumber: 1,
          sku: "LAPTOP-01",
          productName: "Laptop",
          field: "discountPct",
          currentValue: 0.18,
          recommendedValue: 0.12,
        },
      ],
      affectedLines: [1],
    },
    simulatedResult: {
      approved: true,
      approvalLevel: ApprovalLevel.AUTO_APPROVE,
      overallRiskScore: 22,
      decision: "Auto Approved",
      triggeredRules: [],
      failedRules: [],
      warnings: [],
      trace: [],
      recommendations: [],
    },
    costScore: 25.5,
    revenueImpact: -1250,
    marginImpact: 0.03,
    approvalProbability: 0.95,
    riskScore: 22,
    changedLinesCount: 1,
    simulatedContext: baseContext,
  };

  it("formats title, description, and currency symbols properly", () => {
    const rec = formatter.format(mockSim, 1, 0.92, "INR");

    expect(rec.priority).toBe(1);
    expect(rec.confidence).toBe(0.92);
    expect(rec.title).toContain("Reduce Laptop discount from 18% to 12%");
    expect(rec.description).toContain("Auto Approval");
    expect(rec.description).toContain("Risk Score:\n22");
    expect(rec.description).toContain("−₹1,250");
    expect(rec.description).toContain("Margin Impact: +3.0%");
  });

  it("builds currentValues and recommendedValues structures", () => {
    const rec = formatter.format(mockSim, 1, 0.9, "USD");

    expect(rec.currentValues["LAPTOP-01"]).toEqual({ discountPct: 0.18 });
    expect(rec.recommendedValues["LAPTOP-01"]).toEqual({ discountPct: 0.12 });
  });

  it("handles multi-line candidate titles and descriptions", () => {
    const multiSim: SimulationResult = {
      ...mockSim,
      candidate: {
        ...mockSim.candidate,
        type: RecommendationType.MULTI_LINE_OPTIMIZATION,
        changes: [
          {
            lineId: "l1",
            lineNumber: 1,
            sku: "LAPTOP-01",
            productName: "Laptop",
            field: "discountPct",
            currentValue: 0.18,
            recommendedValue: 0.12,
          },
          {
            lineId: "l2",
            lineNumber: 2,
            sku: "MONITOR-01",
            productName: "Monitor",
            field: "discountPct",
            currentValue: 0.20,
            recommendedValue: 0.18,
          },
        ],
        affectedLines: [1, 2],
      },
    };

    const rec = formatter.format(multiSim, 2, 0.88, "USD");
    expect(rec.title).toContain("Laptop and Monitor");
    expect(rec.description).toContain("Laptop discount from 18% to 12%");
    expect(rec.description).toContain("Monitor discount from 20% to 18%");
  });
});
