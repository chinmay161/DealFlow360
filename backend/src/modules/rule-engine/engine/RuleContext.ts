/**
 * RuleContext — Immutable evaluation context for the Rule Engine.
 *
 * Built once per `evaluate()` call from a quotation ID.  Every rule
 * receives the same frozen context so no rule can corrupt shared state.
 *
 * Design notes:
 * • All Prisma Decimal values are converted to plain `number` at build
 *   time so rule authors never deal with Decimal.js directly.
 * • The context is deliberately flat / denormalized for ergonomics —
 *   rules shouldn't have to chase nested relations.
 */

import type { PrismaClient } from "@prisma/client";

// ─── Context Sub-Types ───────────────────────────────────────────────────────

export interface ContextProduct {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  costPrice: number;
  taxRate: number;
  categoryId: string;
  categoryName: string;
}

export interface ContextQuotationLine {
  id: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountPct: number;
  taxAmount: number;
  margin: number;
  subtotal: number;
  lineNumber: number;
  product: ContextProduct;
}

export interface ContextCustomer {
  id: string;
  companyName: string;
  email: string;
  tier: string; // CustomerTier enum value
  status: string;
}

export interface ContextQuotation {
  id: string;
  quoteNumber: string;
  status: string;
  approvalState: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  riskScore: number | null;
  lifetimeMargin: number | null;
  validUntil: Date | null;
  createdAt: Date;
}

export interface ContextDiscountPolicy {
  id: string;
  name: string;
  type: string;  // DiscountType enum
  value: number; // interpreted per type
  minOrderAmt: number | null;
  maxDiscount: number | null;
  tier: string | null; // null = all tiers
  isActive: boolean;
}

export interface ContextApprovalRule {
  id: string;
  name: string;
  stage: number;
  threshold: number;
  approverRole: string; // RoleType enum
  isActive: boolean;
  discountPolicyId: string | null;
}

export interface ContextStockLevel {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  quantity: number;
  reorderAt: number;
}

// ─── RuleContext ──────────────────────────────────────────────────────────────

export interface RuleContext {
  readonly quotation: ContextQuotation;
  readonly lines: readonly ContextQuotationLine[];
  readonly customer: ContextCustomer;
  readonly discountPolicies: readonly ContextDiscountPolicy[];
  readonly approvalRules: readonly ContextApprovalRule[];
  readonly stockLevels: readonly ContextStockLevel[];
  /** Set of unique category names present in this quotation. */
  readonly categories: readonly string[];
  /** Weighted-average discount percentage across all lines. */
  readonly blendedDiscountPct: number;
  /** Weighted-average margin across all lines. */
  readonly blendedMargin: number;
}

// ─── Helper: safe Decimal → number ───────────────────────────────────────────

function d(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

function dNull(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  return Number(val);
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Build a frozen RuleContext by loading all relevant data for a quotation.
 *
 * @throws Error if quotation not found.
 */
export async function buildRuleContext(
  prisma: PrismaClient,
  quotationId: string,
): Promise<RuleContext> {
  // 1. Load quotation with lines → product → category
  const quotation = await prisma.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: {
      customer: true,
      lines: {
        include: {
          product: {
            include: { category: true },
          },
        },
        orderBy: { lineNumber: "asc" },
      },
    },
  });

  // 2. Load discount policies (active, matching customer tier or global)
  const discountPolicies = await prisma.discountPolicy.findMany({
    where: {
      isActive: true,
      OR: [
        { tier: quotation.customer.tier },
        { tier: null },
      ],
    },
  });

  // 3. Load approval rules (active, ordered by stage)
  const approvalRules = await prisma.approvalRule.findMany({
    where: { isActive: true },
    orderBy: { stage: "asc" },
  });

  // 4. Load stock levels for products in this quotation
  const productIds = quotation.lines.map((l) => l.productId);
  const stockLevels = await prisma.stockLevel.findMany({
    where: { productId: { in: productIds } },
    include: { warehouse: { select: { id: true, name: true } } },
  });

  // ── Map to context types ───────────────────────────────────────────────

  const ctxLines: ContextQuotationLine[] = quotation.lines.map((l) => ({
    id: l.id,
    quantity: l.quantity,
    unitPrice: d(l.unitPrice),
    discount: d(l.discount),
    discountPct: d(l.discountPct),
    taxAmount: d(l.taxAmount),
    margin: d(l.margin),
    subtotal: d(l.subtotal),
    lineNumber: l.lineNumber,
    product: {
      id: l.product.id,
      sku: l.product.sku,
      name: l.product.name,
      basePrice: d(l.product.basePrice),
      costPrice: d(l.product.costPrice),
      taxRate: d(l.product.taxRate),
      categoryId: l.product.category.id,
      categoryName: l.product.category.name,
    },
  }));

  const ctxCustomer: ContextCustomer = {
    id: quotation.customer.id,
    companyName: quotation.customer.companyName,
    email: quotation.customer.email,
    tier: quotation.customer.tier,
    status: quotation.customer.status,
  };

  const ctxQuotation: ContextQuotation = {
    id: quotation.id,
    quoteNumber: quotation.quoteNumber,
    status: quotation.status,
    approvalState: quotation.approvalState,
    subtotal: d(quotation.subtotal),
    discountTotal: d(quotation.discountTotal),
    taxTotal: d(quotation.taxTotal),
    grandTotal: d(quotation.grandTotal),
    currency: quotation.currency,
    riskScore: dNull(quotation.riskScore),
    lifetimeMargin: dNull(quotation.lifetimeMargin),
    validUntil: quotation.validUntil,
    createdAt: quotation.createdAt,
  };

  const ctxPolicies: ContextDiscountPolicy[] = discountPolicies.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    value: d(p.value),
    minOrderAmt: dNull(p.minOrderAmt),
    maxDiscount: dNull(p.maxDiscount),
    tier: p.tier,
    isActive: p.isActive,
  }));

  const ctxApprovalRules: ContextApprovalRule[] = approvalRules.map((r) => ({
    id: r.id,
    name: r.name,
    stage: r.stage,
    threshold: d(r.threshold),
    approverRole: r.approverRole,
    isActive: r.isActive,
    discountPolicyId: r.discountPolicyId,
  }));

  const ctxStock: ContextStockLevel[] = stockLevels.map((s) => ({
    warehouseId: s.warehouse.id,
    warehouseName: s.warehouse.name,
    productId: s.productId,
    quantity: s.quantity,
    reorderAt: s.reorderAt,
  }));

  const categories = [...new Set(ctxLines.map((l) => l.product.categoryName))];

  // ── Blended metrics ────────────────────────────────────────────────────

  const totalRevenue = ctxLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const blendedDiscountPct =
    totalRevenue > 0
      ? ctxLines.reduce((sum, l) => sum + l.discountPct * (l.unitPrice * l.quantity), 0) / totalRevenue
      : 0;

  const blendedMargin =
    totalRevenue > 0
      ? ctxLines.reduce((sum, l) => {
          const cost = l.product.costPrice * l.quantity;
          const revenue = l.unitPrice * l.quantity;
          return sum + (revenue > 0 ? (revenue - cost) / revenue : 0) * revenue;
        }, 0) / totalRevenue
      : 0;

  // ── Freeze & return ────────────────────────────────────────────────────

  const context: RuleContext = Object.freeze({
    quotation: Object.freeze(ctxQuotation),
    lines: Object.freeze(ctxLines.map((l) => Object.freeze({ ...l, product: Object.freeze(l.product) }))),
    customer: Object.freeze(ctxCustomer),
    discountPolicies: Object.freeze(ctxPolicies.map((p) => Object.freeze(p))),
    approvalRules: Object.freeze(ctxApprovalRules.map((r) => Object.freeze(r))),
    stockLevels: Object.freeze(ctxStock.map((s) => Object.freeze(s))),
    categories: Object.freeze(categories),
    blendedDiscountPct,
    blendedMargin,
  });

  return context;
}
