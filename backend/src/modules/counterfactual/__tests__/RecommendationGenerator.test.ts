import { describe, it, expect } from "vitest";
import { RecommendationGenerator } from "../services/RecommendationGenerator.js";
import { ApprovalLevel, Severity, type RuleEngineResult } from "../../rule-engine/interfaces/Rule.js";
import { RecommendationType } from "../types/types.js";
import {
  mockDiscountViolatingContext,
  mockCategoryViolatingContext,
  mockLowMarginContext,
  mock50LineContext,
} from "./helpers.js";

describe("RecommendationGenerator", () => {
  const generator = new RecommendationGenerator();

  function makeEngineResult(overrides: Partial<RuleEngineResult> = {}): RuleEngineResult {
    return {
      approved: false,
      approvalLevel: ApprovalLevel.MANAGER,
      overallRiskScore: 55,
      decision: "Manager approval required",
      triggeredRules: [],
      failedRules: [],
      warnings: [],
      trace: [],
      recommendations: [],
      ...overrides,
    };
  }

  it("generates discount adjustment and line-item candidates for discount ceiling violations", () => {
    const context = mockDiscountViolatingContext();
    const initialResult = makeEngineResult({
      trace: [
        {
          ruleId: "discount-ceiling",
          ruleName: "Discount Ceiling Rule",
          passed: false,
          severity: Severity.WARNING,
          score: 50,
          computedValue: 0.18,
          threshold: 0.10,
          approvalRequired: true,
          approvalLevel: ApprovalLevel.MANAGER,
          message: "Exceeded ceiling",
          metadata: {},
          executionTimeMs: 1,
        },
      ],
    });

    const candidates = generator.generateCandidates(context, initialResult);

    expect(candidates.length).toBeGreaterThan(0);
    const discountCand = candidates.find((c) => c.type === RecommendationType.DISCOUNT_ADJUSTMENT);
    expect(discountCand).toBeDefined();
    expect(discountCand?.changes[0].recommendedValue).toBe(0.10);
    // Verifies it only targets the violating line
    expect(discountCand?.affectedLines).toEqual([1]);
  });

  it("generates category-specific discount candidates for category violations", () => {
    const context = mockCategoryViolatingContext();
    const initialResult = makeEngineResult({
      trace: [
        {
          ruleId: "category-discount",
          ruleName: "Category Discount Rule",
          passed: false,
          severity: Severity.WARNING,
          score: 40,
          computedValue: 0.22,
          threshold: 0.12,
          approvalRequired: true,
          approvalLevel: ApprovalLevel.MANAGER,
          message: "Category limit exceeded",
          metadata: {
            violations: [
              {
                category: "Hardware",
                avgDiscountPct: 0.225,
                ceiling: 0.12,
              },
            ],
          },
          executionTimeMs: 1,
        },
      ],
    });

    const candidates = generator.generateCandidates(context, initialResult);

    const catCand = candidates.find((c) => c.type === RecommendationType.CATEGORY_DISCOUNT);
    expect(catCand).toBeDefined();
    expect(catCand?.title).toContain("Hardware");
    expect(catCand?.changes.every((ch) => ch.recommendedValue === 0.12)).toBe(true);
  });

  it("generates margin improvement and price adjustment candidates for low margin quotations", () => {
    const context = mockLowMarginContext();
    const initialResult = makeEngineResult({
      trace: [
        {
          ruleId: "margin",
          ruleName: "Margin Rule",
          passed: false,
          severity: Severity.CRITICAL,
          score: 70,
          computedValue: 0.06,
          threshold: 0.15,
          approvalRequired: true,
          approvalLevel: ApprovalLevel.FINANCE,
          message: "Blended margin is below minimum",
          metadata: {},
          executionTimeMs: 1,
        },
      ],
    });

    const candidates = generator.generateCandidates(context, initialResult);

    const marginCand = candidates.find((c) => c.type === RecommendationType.MARGIN_IMPROVEMENT);
    const priceCand = candidates.find((c) => c.type === RecommendationType.PRICE_ADJUSTMENT);

    expect(marginCand).toBeDefined();
    expect(priceCand).toBeDefined();
    expect(marginCand?.changes[0].recommendedValue).toBe(0); // removes margin-eroding discount
    expect(priceCand?.changes[0].field).toBe("unitPrice");
    expect(priceCand?.changes[0].recommendedValue).toBeGreaterThan(context.lines[0].unitPrice);
  });

  it("generates multi-line optimization candidates when multiple items have discounts", () => {
    const context = mockDiscountViolatingContext();
    const initialResult = makeEngineResult();

    const candidates = generator.generateCandidates(context, initialResult);
    const multiLineCand = candidates.find((c) => c.type === RecommendationType.MULTI_LINE_OPTIMIZATION);

    expect(multiLineCand).toBeDefined();
    expect(multiLineCand?.changes.length).toBeGreaterThanOrEqual(2);
  });

  it("supports quotations with up to 50 lines without exponential explosion", () => {
    const context = mock50LineContext();
    const initialResult = makeEngineResult({
      trace: [
        {
          ruleId: "discount-ceiling",
          ruleName: "Discount Ceiling Rule",
          passed: false,
          severity: Severity.WARNING,
          score: 40,
          computedValue: 0.18,
          threshold: 0.10,
          approvalRequired: true,
          approvalLevel: ApprovalLevel.MANAGER,
          message: "Exceeded ceiling",
          metadata: {},
          executionTimeMs: 1,
        },
      ],
    });

    const start = performance.now();
    const candidates = generator.generateCandidates(context, initialResult);
    const durationMs = performance.now() - start;

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.length).toBeLessThanOrEqual(25);
    expect(durationMs).toBeLessThan(50); // fast generation under 50ms
  });
});
