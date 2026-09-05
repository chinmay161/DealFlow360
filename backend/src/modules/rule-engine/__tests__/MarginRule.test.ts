import { describe, it, expect } from "vitest";
import { MarginRule } from "../rules/MarginRule.js";
import { mockContext, mockLine, mockProduct, mockDiscountPolicy } from "./helpers.js";

const rule = new MarginRule();

describe("MarginRule", () => {
  it("passes when blended margin meets minimum", async () => {
    // costPrice=600, unitPrice=1000 → margin = 40%
    const ctx = mockContext({
      blendedMargin: 0.40,
      discountPolicies: [
        mockDiscountPolicy({ name: "Minimum Margin Policy", value: 0.15 }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
    expect(result.computedValue).toBe(0.40);
  });

  it("fails when blended margin is below minimum", async () => {
    const ctx = mockContext({
      blendedMargin: 0.08,
      lines: [
        mockLine({
          unitPrice: 650,
          product: mockProduct({ costPrice: 600 }),
        }),
      ],
      discountPolicies: [
        mockDiscountPolicy({ name: "Minimum Margin Policy", value: 0.15 }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("CRITICAL");
    expect(result.approvalLevel).toBe("FINANCE");
    expect(result.metadata.recommendation).toBeDefined();
  });

  it("passes with 0% floor when no margin policy exists", async () => {
    const ctx = mockContext({
      blendedMargin: 0.01,
      discountPolicies: [],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true); // 1% > 0%
  });

  it("fails when margin is exactly zero", async () => {
    const ctx = mockContext({
      blendedMargin: 0,
      lines: [
        mockLine({
          unitPrice: 600,
          product: mockProduct({ costPrice: 600 }),
        }),
      ],
      discountPolicies: [
        mockDiscountPolicy({ name: "Minimum Margin Policy", value: 0.10 }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
  });

  it("handles negative margin (selling below cost)", async () => {
    const ctx = mockContext({
      blendedMargin: -0.10,
      lines: [
        mockLine({
          unitPrice: 500,
          product: mockProduct({ costPrice: 600 }),
        }),
      ],
      discountPolicies: [
        mockDiscountPolicy({ name: "Minimum Margin Policy", value: 0.10 }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    expect(result.score).toBeGreaterThan(0);
  });

  it("generates a price-increase recommendation", async () => {
    const ctx = mockContext({
      blendedMargin: 0.05,
      lines: [
        mockLine({
          unitPrice: 630,
          quantity: 1,
          product: mockProduct({ costPrice: 600 }),
        }),
      ],
      discountPolicies: [
        mockDiscountPolicy({ name: "Minimum Margin Policy", value: 0.15 }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    const rec = result.metadata.recommendation as { message: string };
    expect(rec.message).toContain("Increase unit price");
  });
});
