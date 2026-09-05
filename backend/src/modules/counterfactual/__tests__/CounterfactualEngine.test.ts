import { describe, it, expect, vi, beforeEach } from "vitest";
import { CounterfactualEngine } from "../services/CounterfactualEngine.js";
import { RuleEngine } from "../../rule-engine/engine/RuleEngine.js";
import { ApprovalLevel, Severity, type RuleEngineResult } from "../../rule-engine/interfaces/Rule.js";
import { QuotationNotFoundError } from "../utils/errors.js";
import {
  mockDiscountViolatingContext,
  mockPrismaClient,
} from "./helpers.js";

describe("CounterfactualEngine", () => {
  let mockRuleEngine: RuleEngine;

  const approvedResult: RuleEngineResult = {
    approved: true,
    approvalLevel: ApprovalLevel.AUTO_APPROVE,
    overallRiskScore: 10,
    decision: "Quotation auto-approved. All rules passed.",
    triggeredRules: [],
    failedRules: [],
    warnings: [],
    trace: [],
    recommendations: [],
  };

  const rejectedResult: RuleEngineResult = {
    approved: false,
    approvalLevel: ApprovalLevel.FINANCE,
    overallRiskScore: 65,
    decision: "Finance approval required.",
    triggeredRules: [
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
        message: "Line LAPTOP-01 has 18.0% discount, exceeding the 10.0% ceiling.",
        metadata: {},
        executionTimeMs: 1,
      },
    ],
    failedRules: [
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
        message: "Line LAPTOP-01 has 18.0% discount, exceeding the 10.0% ceiling.",
        metadata: {},
        executionTimeMs: 1,
      },
    ],
    warnings: [],
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
        message: "Line LAPTOP-01 has 18.0% discount, exceeding the 10.0% ceiling.",
        metadata: {},
        executionTimeMs: 1,
      },
    ],
    recommendations: [],
  };

  it("returns 'No recommendations' when quotation is already approved", async () => {
    mockRuleEngine = {
      evaluate: vi.fn().mockResolvedValue(approvedResult),
    } as unknown as RuleEngine;

    const prisma = mockPrismaClient();
    const engine = new CounterfactualEngine(prisma, mockRuleEngine);

    const response = await engine.generateRecommendations("quot-discount-violating");

    expect(response.recommendations).toHaveLength(0);
    expect(response.simulationsCount).toBe(0);
    expect(response.currentDecision).toContain("auto-approved");
  });

  it("generates, simulates, ranks, and formats recommendations for unapproved quotation", async () => {
    // Initial evaluation returns rejectedResult; simulated candidate evaluations return approvedResult
    mockRuleEngine = {
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(rejectedResult)
        .mockResolvedValue(approvedResult),
    } as unknown as RuleEngine;

    const prisma = mockPrismaClient();
    const engine = new CounterfactualEngine(prisma, mockRuleEngine);

    const response = await engine.generateRecommendations("quot-discount-violating");

    expect(response.quotationId).toBe("quot-discount-violating");
    expect(response.currentDecision).toBe("Finance approval required.");
    expect(response.recommendations.length).toBeGreaterThan(0);

    const topRec = response.recommendations[0];
    expect(topRec.priority).toBe(1);
    expect(topRec.title).toBeDefined();
    expect(topRec.description).toBeDefined();
    expect(topRec.type).toBeDefined();
    expect(topRec.expectedDecision).toBe("Auto Approval");
    expect(topRec.expectedApprovalLevel).toBe(ApprovalLevel.AUTO_APPROVE);
    expect(topRec.confidence).toBeGreaterThan(0.5);
    expect(topRec.changes.length).toBeGreaterThan(0);
  });

  it("throws QuotationNotFoundError when quotation does not exist", async () => {
    mockRuleEngine = { evaluate: vi.fn() } as unknown as RuleEngine;
    const prisma = mockPrismaClient();
    const engine = new CounterfactualEngine(prisma, mockRuleEngine);

    await expect(engine.generateRecommendations("non-existent")).rejects.toThrow(
      QuotationNotFoundError,
    );
  });

  it("continues evaluating remaining candidates if one candidate simulation fails", async () => {
    let callCount = 0;
    mockRuleEngine = {
      evaluate: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return rejectedResult; // initial
        if (callCount === 2) throw new Error("Simulated transient simulation failure");
        return approvedResult; // subsequent candidates succeed
      }),
    } as unknown as RuleEngine;

    const prisma = mockPrismaClient();
    const engine = new CounterfactualEngine(prisma, mockRuleEngine);

    const response = await engine.generateRecommendations("quot-discount-violating");

    expect(response.recommendations.length).toBeGreaterThan(0);
  });

  it("executes direct ad-hoc simulation via simulate()", async () => {
    mockRuleEngine = {
      evaluate: vi.fn().mockResolvedValue(approvedResult),
    } as unknown as RuleEngine;

    const prisma = mockPrismaClient();
    const engine = new CounterfactualEngine(prisma, mockRuleEngine);

    const response = await engine.simulate("quot-discount-violating", [
      {
        lineId: "line-laptop",
        field: "discountPct",
        value: 0.10,
      },
    ]);

    expect(response.approved).toBe(true);
    expect(response.simulatedApprovalLevel).toBe(ApprovalLevel.AUTO_APPROVE);
  });

  it("executes recommendation generation under 150 ms for typical quotations", async () => {
    mockRuleEngine = {
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(rejectedResult)
        .mockResolvedValue(approvedResult),
    } as unknown as RuleEngine;

    const prisma = mockPrismaClient();
    const engine = new CounterfactualEngine(prisma, mockRuleEngine);

    const start = performance.now();
    const response = await engine.generateRecommendations("quot-discount-violating");
    const totalMs = performance.now() - start;

    expect(totalMs).toBeLessThan(150);
    expect(response.executionTimeMs).toBeDefined();
  });
});
