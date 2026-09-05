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
  // 1. Load quotation with lineItems → product → category
  const quotation = await prisma.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: {
      customer: {
        include: { contacts: true },
      },
      lineItems: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
    },
  });

  // 2. Load discount policies (active, matching customer tier or global)
  const discountPolicies: any[] = typeof (prisma as any).discountPolicy?.findMany === "function"
    ? await (prisma as any).discountPolicy.findMany({
        where: {
          isActive: true,
          OR: [
            { tier: quotation.customer.tier },
            { tier: null },
          ],
        },
      })
    : [];

  // 3. Load approval rules (active, ordered by stage)
  const approvalRules: any[] = typeof (prisma as any).approvalRule?.findMany === "function"
    ? await (prisma as any).approvalRule.findMany({
        where: { isActive: true },
        orderBy: { stage: "asc" },
      })
    : [];

  const rawLines: any[] = quotation.lineItems || (quotation as any).lines || [];

  // 4. Load stock levels for products in this quotation
  const productIds = rawLines
    .map((l) => l.productId || l.product?.id)
    .filter((id): id is string => Boolean(id));

  const stockLevels: any[] = typeof (prisma as any).stockLevel?.findMany === "function"
    ? await (prisma as any).stockLevel.findMany({
        where: { productId: { in: productIds } },
        include: { warehouse: { select: { id: true, name: true } } },
      })
    : [];

  // ── Map to context types ───────────────────────────────────────────────

  const ctxLines: ContextQuotationLine[] = rawLines.map((l, index) => {
    const unitPrice = d(l.unitPrice);
    const qty = l.quantity;
    const discountPct = d(l.discountPercent ?? (l as any).discountPct);
    const lineTotal = d(l.lineTotal ?? (l as any).subtotal) || unitPrice * qty * (1 - discountPct / 100);
    const discountAmount = d((l as any).discount) || unitPrice * qty * (discountPct / 100);
    const margin = d(l.estimatedMarginPercent ?? (l as any).margin);
    const costPrice = d(l.product?.costPrice) || unitPrice * 0.7;

    return {
      id: l.id,
      quantity: qty,
      unitPrice,
      discount: discountAmount,
      discountPct,
      taxAmount: d(l.taxAmount),
      margin,
      subtotal: lineTotal,
      lineNumber: (l as any).lineNumber ?? index + 1,
      product: {
        id: l.product?.id ?? l.productId ?? `prod-${index}`,
        sku: l.product?.sku ?? `SKU-${index}`,
        name: l.product?.name ?? "Product",
        basePrice: d(l.product?.basePrice ?? unitPrice),
        costPrice,
        taxRate: d(l.product?.taxRate ?? 0.18),
        categoryId: l.product?.categoryId ?? l.product?.category?.id ?? "cat-1",
        categoryName: (l.product as any)?.categoryName ?? l.product?.category?.name ?? "General",
      },
    };
  });

  const contacts: any[] = quotation.customer?.contacts || [];
  const primaryContact = contacts.find((c: any) => c.isPrimary) ?? contacts[0];

  const ctxCustomer: ContextCustomer = {
    id: quotation.customer?.id ?? "cust-unknown",
    companyName: quotation.customer?.name ?? (quotation.customer as any)?.companyName ?? "Customer",
    email: primaryContact?.email ?? (quotation.customer as any)?.email ?? "info@enterprise.example",
    tier: quotation.customer?.tier ?? "BRONZE",
    status: (quotation.customer as any)?.status ?? "ACTIVE",
  };

  const ctxQuotation: ContextQuotation = {
    id: quotation.id,
    quoteNumber: quotation.quotationNumber ?? (quotation as any).quoteNumber ?? "QT-000",
    status: quotation.status,
    approvalState: quotation.currentStage ?? (quotation as any).approvalState ?? "DRAFT",
    subtotal: d(quotation.subtotal),
    discountTotal: d(quotation.discountTotal),
    taxTotal: d(quotation.taxTotal),
    grandTotal: d(quotation.totalValue ?? (quotation as any).grandTotal),
    currency: quotation.currency,
    riskScore: dNull(quotation.riskScore),
    lifetimeMargin: dNull((quotation as any).lifetimeMargin),
    validUntil: (quotation as any).validUntil ?? null,
    createdAt: quotation.createdAt ?? new Date(),
  };

  const ctxPolicies: ContextDiscountPolicy[] = discountPolicies.map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    value: d(p.value),
    minOrderAmt: dNull(p.minOrderAmt),
    maxDiscount: dNull(p.maxDiscount),
    tier: p.tier,
    isActive: p.isActive,
  }));

  const ctxApprovalRules: ContextApprovalRule[] = approvalRules.map((r: any) => ({
    id: r.id,
    name: r.name,
    stage: r.stage,
    threshold: d(r.threshold),
    approverRole: r.approverRole,
    isActive: r.isActive,
    discountPolicyId: r.discountPolicyId,
  }));

  const ctxStock: ContextStockLevel[] = stockLevels.map((s: any) => ({
    warehouseId: s.warehouse?.id ?? "wh-blr",
    warehouseName: s.warehouse?.name ?? "Bengaluru Warehouse",
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
