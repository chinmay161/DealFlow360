import { describe, it, expect } from "vitest";
import { CustomerTierRule } from "../rules/CustomerTierRule.js";
import { mockContext, mockLine, mockDiscountPolicy, mockCustomer, mockQuotation } from "./helpers.js";

const rule = new CustomerTierRule();

describe("CustomerTierRule", () => {
  it("passes for GOLD customer with low discount", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "GOLD" }),
      blendedDiscountPct: 0.05,
      discountPolicies: [
        mockDiscountPolicy({ tier: "GOLD", value: 0.20 }), // 20% ceiling for Gold
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
    expect(result.score).toBeLessThan(30); // low base risk for Gold
  });

  it("fails for BRONZE customer exceeding tier limit", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "BRONZE" }),
      blendedDiscountPct: 0.12,
      discountPolicies: [
        mockDiscountPolicy({ tier: "BRONZE", value: 0.05 }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("exceeds");
    expect(result.metadata.recommendation).toBeDefined();
  });

  it("uses default 5% ceiling when no tier policy exists", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "SILVER" }),
      blendedDiscountPct: 0.03,
      discountPolicies: [], // no policies
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
  });

  it("emits warning when near the limit (>80% of ceiling)", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "SILVER" }),
      blendedDiscountPct: 0.09, // 90% of 10% ceiling
      discountPolicies: [
        mockDiscountPolicy({ tier: "SILVER", value: 0.10 }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(true);
    expect(result.severity).toBe("WARNING");
    expect(result.metadata.nearLimit).toBe(true);
  });

  it("fails when order total exceeds tier cap", async () => {
    const ctx = mockContext({
      customer: mockCustomer({ tier: "BRONZE" }),
      blendedDiscountPct: 0.02,
      quotation: mockQuotation({ grandTotal: 60000 }),
      discountPolicies: [
        mockDiscountPolicy({ tier: "BRONZE", value: 0.05, maxDiscount: 50000 }),
      ],
    });

    const result = await rule.evaluate(ctx);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("Order total");
  });

  it("assigns higher base risk to lower tiers", async () => {
    const ctxBronze = mockContext({
      customer: mockCustomer({ tier: "BRONZE" }),
      blendedDiscountPct: 0.01,
      discountPolicies: [mockDiscountPolicy({ tier: "BRONZE", value: 0.05 })],
    });
    const ctxGold = mockContext({
      customer: mockCustomer({ tier: "GOLD" }),
      blendedDiscountPct: 0.01,
      discountPolicies: [mockDiscountPolicy({ tier: "GOLD", value: 0.20 })],
    });

    const bronzeResult = await rule.evaluate(ctxBronze);
    const goldResult = await rule.evaluate(ctxGold);

    expect(bronzeResult.score).toBeGreaterThan(goldResult.score);
  });
});
