/**
 * DecisionTraceService — Unit Tests
 *
 * Tests the orchestration logic with mocked Prisma client.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DecisionTraceService, QuotationNotFoundError } from "../services/DecisionTraceService.js";
import { mockEvaluationSet, mockAllPassingSet } from "./helpers.js";

// ─── Mock Prisma Client ──────────────────────────────────────────────────────

function createMockPrisma(overrides: {
  quotation?: unknown;
  evaluations?: unknown[];
} = {}) {
  return {
    quotation: {
      findUnique: vi.fn().mockResolvedValue(
        overrides.quotation !== undefined
          ? overrides.quotation
          : { id: "quot-1", currency: "INR" },
      ),
    },
    ruleEvaluation: {
      findMany: vi.fn().mockResolvedValue(
        overrides.evaluations ?? mockEvaluationSet().map((ev) => ({
          ...ev,
          // Simulate Prisma Decimal by keeping as numbers (Prisma returns Decimal objects but we Number() them)
          computedValue: ev.computedValue,
          threshold: ev.threshold,
        })),
      ),
    },
  } as any;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("DecisionTraceService", () => {
  describe("getDecisionTrace", () => {
    it("returns full trace for a quotation with evaluations", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.getDecisionTrace("quot-1");

      // Should NOT be an empty trace
      expect("message" in result).toBe(false);

      if (!("message" in result)) {
        expect(result.quotationId).toBe("quot-1");
        expect(result.overallDecision).toContain("Finance");
        expect(result.overallRiskScore).toBe(82);
        expect(result.approvalLevel).toBe("FINANCE");
        expect(result.rules).toHaveLength(6);
        expect(result.decisionTree).toHaveLength(6);
        expect(result.timeline).toHaveLength(6);
        expect(result.statistics.rulesEvaluated).toBe(6);
        expect(result.statistics.passed).toBe(3);
        expect(result.statistics.failed).toBe(2);
        expect(result.statistics.warnings).toBe(1);
        expect(result.summary).toContain("Finance approval required");
      }
    });

    it("throws QuotationNotFoundError for non-existent quotation", async () => {
      const prisma = createMockPrisma({ quotation: null });
      const service = new DecisionTraceService(prisma);

      await expect(service.getDecisionTrace("non-existent"))
        .rejects
        .toThrow(QuotationNotFoundError);
    });

    it("returns empty-trace message when no evaluations exist", async () => {
      const prisma = createMockPrisma({ evaluations: [] });
      const service = new DecisionTraceService(prisma);

      const result = await service.getDecisionTrace("quot-1");

      expect("message" in result).toBe(true);
      if ("message" in result) {
        expect(result.message).toBe("No decision trace available.");
      }
    });

    it("applies filter for passed rules", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.getDecisionTrace("quot-1", { passed: true });

      if (!("message" in result)) {
        expect(result.rules.every((r) => r.status === "PASS")).toBe(true);
        expect(result.rules.length).toBeLessThan(6);
      }
    });

    it("applies filter for failed rules", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.getDecisionTrace("quot-1", { failed: true });

      if (!("message" in result)) {
        expect(result.rules.every((r) => r.status === "FAIL")).toBe(true);
        expect(result.rules).toHaveLength(2);
      }
    });

    it("applies severity filter", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.getDecisionTrace("quot-1", { severity: "MEDIUM" });

      if (!("message" in result)) {
        expect(result.rules.every((r) => r.severity === "MEDIUM")).toBe(true);
      }
    });

    it("applies rule name filter", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.getDecisionTrace("quot-1", { rule: "Margin" });

      if (!("message" in result)) {
        expect(result.rules).toHaveLength(1);
        expect(result.rules[0].ruleName).toBe("Margin Rule");
      }
    });

    it("returns human-formatted trace when format is 'human'", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.getDecisionTrace("quot-1", { format: "human" });

      if (!("message" in result)) {
        // Discount ceiling rule should have percentage formatting
        const discountRule = result.rules.find(
          (r) => r.ruleId === "discount-ceiling",
        );
        expect(typeof discountRule?.computedValue).toBe("string");
        expect(discountRule?.computedValue).toContain("%");
      }
    });

    it("preserves statistics from unfiltered entries even when filtering", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.getDecisionTrace("quot-1", { passed: true });

      if (!("message" in result)) {
        // Stats should reflect ALL entries, not just filtered
        expect(result.statistics.rulesEvaluated).toBe(6);
        // But rules array should be filtered
        expect(result.rules.length).toBeLessThan(6);
      }
    });
  });

  describe("searchTraces", () => {
    it("calls prisma with correct where clause for outcome filter", async () => {
      const prisma = createMockPrisma({ evaluations: [] });
      const service = new DecisionTraceService(prisma);

      await service.searchTraces({ outcome: "FAIL" });

      expect(prisma.ruleEvaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ outcome: "FAIL" }),
        }),
      );
    });

    it("caps results at 100", async () => {
      const prisma = createMockPrisma({ evaluations: [] });
      const service = new DecisionTraceService(prisma);

      await service.searchTraces({});

      expect(prisma.ruleEvaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe("exportTrace", () => {
    it("exports as JSON by default", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.exportTrace("quot-1", "json");

      const parsed = JSON.parse(result);
      expect(parsed.quotationId).toBe("quot-1");
      expect(parsed.rules).toHaveLength(6);
    });

    it("exports as CSV with correct headers", async () => {
      const prisma = createMockPrisma();
      const service = new DecisionTraceService(prisma);

      const result = await service.exportTrace("quot-1", "csv");
      const lines = result.split("\n");

      expect(lines[0]).toBe(
        "ruleId,ruleName,status,severity,computedValue,threshold,outcome,explanation,evaluatedAt,inputs",
      );
      // Data rows
      expect(lines.length).toBe(7); // header + 6 evaluations
    });

    it("exports empty trace as JSON message", async () => {
      const prisma = createMockPrisma({ evaluations: [] });
      const service = new DecisionTraceService(prisma);

      const result = await service.exportTrace("quot-1", "json");
      const parsed = JSON.parse(result);

      expect(parsed.message).toBe("No decision trace available.");
    });

    it("exports empty trace as CSV with message", async () => {
      const prisma = createMockPrisma({ evaluations: [] });
      const service = new DecisionTraceService(prisma);

      const result = await service.exportTrace("quot-1", "csv");

      expect(result).toContain("No decision trace available.");
    });
  });
});
