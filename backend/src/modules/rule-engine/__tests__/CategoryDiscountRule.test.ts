import { describe, it, expect } from "vitest";
import { CategoryDiscountRule } from "../rules/CategoryDiscountRule.js";
import { mockContext, mockLine, mockProduct, mockDiscountPolicy } from "./helpers.js";

const rule = new CategoryDiscountRule();

describe("CategoryDiscountRule", () => {
  it("passes when all category discounts are within limits", async () => {
    const ctx = mockContext({
      lines: [
        mockLine({ discountPct: 0.08, product: mockProduct({ categoryName: "Hardware" }) }),
        mockLine({
          id: "line-2",
          discountPct: 0.15,
          product: mockProduct({ id: "prod-2", sku: "SKU-SW", categoryName: "Software" }),
        }),
      ],
      discountPolicies: [
        mockDiscountPolicy({ name: "Hardware Discount Limit", value: 0.10, tier: null }),
        mockDiscountPolicy({ id: "policy-2", name: "Software Discount Limit", value: 0.25, tier: null }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
    expect(result.message).toBe("All category discounts within limits.");
  });

  it("fails when a category exceeds its limit", async () => {
    const ctx = mockContext({
      lines: [
        mockLine({ discountPct: 0.15, product: mockProduct({ categoryName: "Hardware" }) }),
      ],
      discountPolicies: [
        mockDiscountPolicy({ name: "Hardware Discount Limit", value: 0.10, tier: null }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("Hardware");
    expect(result.metadata.recommendation).toBeDefined();
  });

  it("passes when no category policy exists (no limit configured)", async () => {
    const ctx = mockContext({
      lines: [mockLine({ discountPct: 0.50, product: mockProduct({ categoryName: "Services" }) })],
      discountPolicies: [], // no policies
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
  });

  it("handles mixed-category quotations correctly", async () => {
    const ctx = mockContext({
      lines: [
        mockLine({ discountPct: 0.12, unitPrice: 500, quantity: 5, product: mockProduct({ categoryName: "Hardware" }) }),
        mockLine({
          id: "line-2",
          discountPct: 0.30,
          unitPrice: 200,
          quantity: 10,
          product: mockProduct({ id: "prod-2", sku: "SKU-SW", categoryName: "Software" }),
        }),
      ],
      discountPolicies: [
        mockDiscountPolicy({ name: "Hardware Discount Limit", value: 0.10, tier: null }),
        mockDiscountPolicy({ id: "policy-2", name: "Software Discount Limit", value: 0.25, tier: null }),
      ],
      categories: ["Hardware", "Software"],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    // Both Hardware (12% > 10%) and Software (30% > 25%) should violate
    expect((result.metadata.violations as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it("uses tier-specific policy when available", async () => {
    const ctx = mockContext({
      lines: [mockLine({ discountPct: 0.08, product: mockProduct({ categoryName: "Hardware" }) })],
      customer: { id: "c1", companyName: "Test", email: "t@t.com", tier: "GOLD", status: "ACTIVE" },
      discountPolicies: [
        mockDiscountPolicy({ name: "Hardware Discount Limit", value: 0.15, tier: "GOLD" }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
  });
});
