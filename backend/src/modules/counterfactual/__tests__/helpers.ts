/**
 * Counterfactual Test Helpers & Mock Fixtures
 */

import type { RuleContext, ContextQuotationLine } from "../../rule-engine/engine/RuleContext.js";
import {
  mockContext,
  mockLine,
  mockProduct,
  mockCustomer,
  mockQuotation,
  mockDiscountPolicy,
  mockApprovalRule,
} from "../../rule-engine/__tests__/helpers.js";

/**
 * Build a mock context with excessive discount on a single line (violating DiscountCeilingRule).
 */
export function mockDiscountViolatingContext(): RuleContext {
  const line1 = mockLine({
    id: "line-laptop",
    lineNumber: 1,
    quantity: 1,
    unitPrice: 50000,
    discountPct: 0.18, // 18% > 10% ceiling
    discount: 9000,
    subtotal: 41000,
    product: mockProduct({
      id: "prod-laptop",
      sku: "LAPTOP-01",
      name: "Laptop",
      basePrice: 50000,
      costPrice: 35000,
      categoryName: "Hardware",
    }),
  });

  const line2 = mockLine({
    id: "line-mouse",
    lineNumber: 2,
    quantity: 2,
    unitPrice: 1000,
    discountPct: 0.05, // within ceiling
    discount: 50,
    subtotal: 1900,
    product: mockProduct({
      id: "prod-mouse",
      sku: "MOUSE-01",
      name: "Mouse",
      basePrice: 1000,
      costPrice: 500,
      categoryName: "Accessories",
    }),
  });

  return mockContext({
    lines: [line1, line2],
    quotation: mockQuotation({
      id: "quot-discount-violating",
      currency: "INR",
    }),
    discountPolicies: [
      mockDiscountPolicy({
        id: "policy-bronze",
        name: "Bronze Tier Ceiling",
        type: "PERCENTAGE",
        value: 0.10, // 10% ceiling
        tier: "BRONZE",
      }),
    ],
  });
}

/**
 * Build a mock context with category discount violation.
 */
export function mockCategoryViolatingContext(): RuleContext {
  const lineHardware1 = mockLine({
    id: "line-hw-1",
    lineNumber: 1,
    quantity: 1,
    unitPrice: 10000,
    discountPct: 0.25,
    discount: 2500,
    subtotal: 7500,
    product: mockProduct({
      id: "prod-hw-1",
      sku: "HW-01",
      name: "Server",
      categoryName: "Hardware",
      costPrice: 6000,
    }),
  });

  const lineHardware2 = mockLine({
    id: "line-hw-2",
    lineNumber: 2,
    quantity: 1,
    unitPrice: 5000,
    discountPct: 0.20,
    discount: 1000,
    subtotal: 4000,
    product: mockProduct({
      id: "prod-hw-2",
      sku: "HW-02",
      name: "Switch",
      categoryName: "Hardware",
      costPrice: 3000,
    }),
  });

  return mockContext({
    lines: [lineHardware1, lineHardware2],
    discountPolicies: [
      mockDiscountPolicy({
        id: "policy-hw",
        name: "Hardware Discount Limit",
        type: "PERCENTAGE",
        value: 0.12, // 12% category limit
        tier: "BRONZE",
      }),
    ],
  });
}

/**
 * Build a mock context with low margin (violating MarginRule).
 */
export function mockLowMarginContext(): RuleContext {
  const line = mockLine({
    id: "line-low-margin",
    lineNumber: 1,
    quantity: 1,
    unitPrice: 10000,
    discountPct: 0.20,
    discount: 2000,
    subtotal: 8000,
    margin: 500, // 500 / 8000 = 6.25% < 15% min
    product: mockProduct({
      id: "prod-margin",
      sku: "PROD-LOW-MARGIN",
      name: "Low Margin Product",
      basePrice: 10000,
      costPrice: 7500,
    }),
  });

  return mockContext({
    lines: [line],
    discountPolicies: [
      mockDiscountPolicy({
        id: "policy-margin",
        name: "Minimum Margin Rule",
        type: "PERCENTAGE",
        value: 0.15, // 15% min margin
        tier: "BRONZE",
      }),
    ],
  });
}

/**
 * Build a multi-line context with 50 quotation lines to verify scale and performance.
 */
export function mock50LineContext(): RuleContext {
  const lines: ContextQuotationLine[] = [];
  for (let i = 1; i <= 50; i++) {
    lines.push(
      mockLine({
        id: `line-${i}`,
        lineNumber: i,
        quantity: i % 5 + 1,
        unitPrice: 1000 + i * 50,
        discountPct: i <= 5 ? 0.18 : 0.05, // first 5 lines exceed 10% ceiling
        discount: (1000 + i * 50) * (i <= 5 ? 0.18 : 0.05),
        subtotal: (1000 + i * 50) * (i % 5 + 1) * (1 - (i <= 5 ? 0.18 : 0.05)),
        product: mockProduct({
          id: `prod-${i}`,
          sku: `SKU-${i.toString().padStart(3, "0")}`,
          name: `Product ${i}`,
          basePrice: 1000 + i * 50,
          costPrice: 600 + i * 30,
          categoryName: i % 2 === 0 ? "Hardware" : "Software",
        }),
      }),
    );
  }

  return mockContext({
    lines,
    discountPolicies: [
      mockDiscountPolicy({
        id: "policy-50",
        name: "Bronze Ceiling",
        type: "PERCENTAGE",
        value: 0.10,
        tier: "BRONZE",
      }),
    ],
  });
}

/**
 * Build a mock PrismaClient for testing services.
 */
export function mockPrismaClient(contextToReturn?: RuleContext) {
  const ctx = contextToReturn ?? mockDiscountViolatingContext();

  return {
    quotation: {
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        if (where.id === "non-existent") {
          const err = new Error("Record to update not found.");
          (err as any).code = "P2025";
          throw err;
        }
        return {
          id: ctx.quotation.id,
          quoteNumber: ctx.quotation.quoteNumber,
          status: ctx.quotation.status,
          approvalState: ctx.quotation.approvalState,
          subtotal: ctx.quotation.subtotal,
          discountTotal: ctx.quotation.discountTotal,
          taxTotal: ctx.quotation.taxTotal,
          grandTotal: ctx.quotation.grandTotal,
          currency: ctx.quotation.currency,
          riskScore: ctx.quotation.riskScore,
          lifetimeMargin: ctx.quotation.lifetimeMargin,
          validUntil: ctx.quotation.validUntil,
          createdAt: ctx.quotation.createdAt,
          customer: {
            id: ctx.customer.id,
            companyName: ctx.customer.companyName,
            email: ctx.customer.email,
            tier: ctx.customer.tier,
            status: ctx.customer.status,
          },
          lines: ctx.lines.map((l) => ({
            id: l.id,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discount: l.discount,
            discountPct: l.discountPct,
            taxAmount: l.taxAmount,
            margin: l.margin,
            subtotal: l.subtotal,
            lineNumber: l.lineNumber,
            product: {
              id: l.product.id,
              sku: l.product.sku,
              name: l.product.name,
              basePrice: l.product.basePrice,
              costPrice: l.product.costPrice,
              taxRate: l.product.taxRate,
              category: {
                id: l.product.categoryId,
                name: l.product.categoryName,
              },
            },
          })),
        };
      },
    },
    discountPolicy: {
      findMany: async () =>
        ctx.discountPolicies.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          value: p.value,
          minOrderAmt: p.minOrderAmt,
          maxDiscount: p.maxDiscount,
          tier: p.tier,
          isActive: p.isActive,
        })),
    },
    approvalRule: {
      findMany: async () =>
        ctx.approvalRules.map((r) => ({
          id: r.id,
          name: r.name,
          stage: r.stage,
          threshold: r.threshold,
          approverRole: r.approverRole,
          isActive: r.isActive,
          discountPolicyId: r.discountPolicyId,
        })),
    },
    stockLevel: {
      findMany: async () =>
        ctx.stockLevels.map((s) => ({
          warehouseId: s.warehouseId,
          productId: s.productId,
          quantity: s.quantity,
          reorderAt: s.reorderAt,
          warehouse: { id: s.warehouseId, name: s.warehouseName },
        })),
    },
  } as any;
}
