/**
 * Test helpers — mock RuleContext factory.
 *
 * Tests never touch the real database. They build mock contexts
 * directly and pass them to rules.
 */

import type { RuleContext, ContextQuotationLine, ContextProduct, ContextCustomer, ContextQuotation, ContextDiscountPolicy, ContextApprovalRule, ContextStockLevel } from "../engine/RuleContext.js";

// ─── Defaults ────────────────────────────────────────────────────────────────

export function mockProduct(overrides: Partial<ContextProduct> = {}): ContextProduct {
  return {
    id: "prod-1",
    sku: "SKU-001",
    name: "Test Product",
    basePrice: 1000,
    costPrice: 600,
    taxRate: 0.18,
    categoryId: "cat-1",
    categoryName: "Hardware",
    ...overrides,
  };
}

export function mockLine(overrides: Partial<ContextQuotationLine> = {}): ContextQuotationLine {
  return {
    id: "line-1",
    quantity: 10,
    unitPrice: 1000,
    discount: 0,
    discountPct: 0,
    taxAmount: 180,
    margin: 400,
    subtotal: 10000,
    lineNumber: 1,
    product: mockProduct(),
    ...overrides,
  };
}

export function mockCustomer(overrides: Partial<ContextCustomer> = {}): ContextCustomer {
  return {
    id: "cust-1",
    companyName: "Acme Corp",
    email: "acme@example.com",
    tier: "BRONZE",
    status: "ACTIVE",
    ...overrides,
  };
}

export function mockQuotation(overrides: Partial<ContextQuotation> = {}): ContextQuotation {
  return {
    id: "quot-1",
    quoteNumber: "Q-2024-001",
    status: "DRAFT",
    approvalState: "PENDING",
    subtotal: 10000,
    discountTotal: 0,
    taxTotal: 1800,
    grandTotal: 11800,
    currency: "USD",
    riskScore: null,
    lifetimeMargin: null,
    validUntil: null,
    createdAt: new Date("2024-01-15"),
    ...overrides,
  };
}

export function mockDiscountPolicy(overrides: Partial<ContextDiscountPolicy> = {}): ContextDiscountPolicy {
  return {
    id: "policy-1",
    name: "Bronze Discount Ceiling",
    type: "PERCENTAGE",
    value: 0.05, // 5%
    minOrderAmt: null,
    maxDiscount: null,
    tier: "BRONZE",
    isActive: true,
    ...overrides,
  };
}

export function mockApprovalRule(overrides: Partial<ContextApprovalRule> = {}): ContextApprovalRule {
  return {
    id: "arule-1",
    name: "Manager Approval",
    stage: 1,
    threshold: 0.10, // 10%
    approverRole: "MANAGER",
    isActive: true,
    discountPolicyId: null,
    ...overrides,
  };
}

export function mockStockLevel(overrides: Partial<ContextStockLevel> = {}): ContextStockLevel {
  return {
    warehouseId: "wh-1",
    warehouseName: "Main Warehouse",
    productId: "prod-1",
    quantity: 100,
    reorderAt: 10,
    ...overrides,
  };
}

/**
 * Build a complete mock RuleContext.
 * Override any field; un-overridden fields get sensible defaults.
 */
export function mockContext(overrides: Partial<RuleContext> = {}): RuleContext {
  const lines = overrides.lines ?? [mockLine()];
  const totalRevenue = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const blendedDiscountPct =
    overrides.blendedDiscountPct ??
    (totalRevenue > 0
      ? lines.reduce((s, l) => s + l.discountPct * l.unitPrice * l.quantity, 0) / totalRevenue
      : 0);
  const blendedMargin =
    overrides.blendedMargin ??
    (totalRevenue > 0
      ? lines.reduce((s, l) => {
          const cost = l.product.costPrice * l.quantity;
          const rev = l.unitPrice * l.quantity;
          return s + (rev > 0 ? (rev - cost) / rev : 0) * rev;
        }, 0) / totalRevenue
      : 0);

  return {
    quotation: overrides.quotation ?? mockQuotation(),
    lines,
    customer: overrides.customer ?? mockCustomer(),
    discountPolicies: overrides.discountPolicies ?? [mockDiscountPolicy()],
    approvalRules: overrides.approvalRules ?? [mockApprovalRule()],
    stockLevels: overrides.stockLevels ?? [mockStockLevel()],
    categories: overrides.categories ?? [...new Set((overrides.lines ?? [mockLine()]).map((l) => l.product.categoryName))],
    blendedDiscountPct,
    blendedMargin,
  };
}
