import { describe, it, expect } from "vitest";
import { DiscountCeilingRule } from "../rules/DiscountCeilingRule.js";
import { mockContext, mockLine, mockProduct, mockDiscountPolicy } from "./helpers.js";

const rule = new DiscountCeilingRule();

describe("DiscountCeilingRule", () => {
  it("passes when all line discounts are within ceiling", async () => {
    const ctx = mockContext({
      lines: [
        mockLine({ discountPct: 0.03, product: mockProduct() }),
        mockLine({ id: "line-2", discountPct: 0.04, product: mockProduct({ id: "prod-2", sku: "SKU-002" }) }),
      ],
      discountPolicies: [mockDiscountPolicy({ value: 0.05 })], // 5% ceiling
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
    expect(result.approvalRequired).toBe(false);
    expect(result.score).toBe(0);
  });

  it("fails when a line exceeds the ceiling", async () => {
    const ctx = mockContext({
      lines: [
        mockLine({ discountPct: 0.12, product: mockProduct({ sku: "SKU-BAD" }) }),
      ],
      discountPolicies: [mockDiscountPolicy({ value: 0.05 })], // 5% ceiling
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    expect(result.approvalRequired).toBe(true);
    expect(result.computedValue).toBe(0.12);
    expect(result.threshold).toBe(0.05);
    expect(result.message).toContain("SKU-BAD");
    expect(result.metadata.recommendation).toBeDefined();
  });

  it("passes with info when no policy is configured", async () => {
    const ctx = mockContext({ discountPolicies: [] });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
    expect(result.message).toContain("No discount ceiling policy");
  });

  it("passes when discount exactly equals ceiling (boundary)", async () => {
    const ctx = mockContext({
      lines: [mockLine({ discountPct: 0.05 })],
      discountPolicies: [mockDiscountPolicy({ value: 0.05 })],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
  });

  it("finds the worst offending line among many", async () => {
    const ctx = mockContext({
      lines: [
        mockLine({ discountPct: 0.03, product: mockProduct({ sku: "OK-1" }) }),
        mockLine({ id: "line-2", discountPct: 0.15, product: mockProduct({ id: "prod-2", sku: "BAD-1" }) }),
        mockLine({ id: "line-3", discountPct: 0.08, product: mockProduct({ id: "prod-3", sku: "OK-2" }) }),
      ],
      discountPolicies: [mockDiscountPolicy({ value: 0.10 })],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    expect(result.metadata.offendingLineSku).toBe("BAD-1");
    expect(result.computedValue).toBe(0.15);
  });

  it("uses global policy when no tier-specific policy exists", async () => {
    const ctx = mockContext({
      lines: [mockLine({ discountPct: 0.08 })],
      discountPolicies: [mockDiscountPolicy({ tier: null, value: 0.10 })],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
  });
});
