/**
 * Discount Configuration Module — Test Helpers & Stateful Mock Prisma Client
 */

import { vi } from "vitest";

export function mockDiscountPolicyRecord(overrides: Partial<any> = {}) {
  return {
    id: "policy-1",
    name: "Hardware Gold Discount Policy",
    description: JSON.stringify({
      category: "Hardware",
      minMargin: 0.15,
      effectiveDate: "2026-01-01T00:00:00.000Z",
      expiryDate: "2026-12-31T23:59:59.000Z",
      userDescription: "Standard hardware discount for gold tier customers",
    }),
    type: "PERCENTAGE",
    value: 0.15,
    minOrderAmt: null,
    maxDiscount: 100000,
    tier: "GOLD",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function mockApprovalRuleRecord(overrides: Partial<any> = {}) {
  return {
    id: "rule-1",
    name: "Stage 1 Manager Approval Rule",
    description: JSON.stringify({
      approvalLevel: "MANAGER",
      riskThreshold: 30,
      minQuotationValue: 10000,
      maxQuotationValue: 50000,
      priority: 1,
      userDescription: "Manager approval required for deals up to 50k with moderate risk",
    }),
    stage: 1,
    threshold: 0.15,
    approverRole: "MANAGER",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function mockCategories() {
  return [
    { id: "cat-1", name: "Hardware", isActive: true },
    { id: "cat-2", name: "Software", isActive: true },
    { id: "cat-3", name: "Services", isActive: true },
  ];
}

export function createMockPrisma(initialData?: {
  discountPolicies?: any[];
  approvalRules?: any[];
  categories?: any[];
  auditLogs?: any[];
}) {
  const discountPolicies = [...(initialData?.discountPolicies ?? [mockDiscountPolicyRecord()])];
  const approvalRules = [...(initialData?.approvalRules ?? [mockApprovalRuleRecord()])];
  const categories = [...(initialData?.categories ?? mockCategories())];
  const auditLogs = [...(initialData?.auditLogs ?? [])];

  const client: any = {
    discountPolicy: {
      findUnique: vi.fn(async ({ where }: any) => {
        return (
          discountPolicies.find(
            (p) => p.id === where.id || (where.name && p.name === where.name),
          ) ?? null
        );
      }),
      findMany: vi.fn(async ({ where, orderBy }: any) => {
        let results = discountPolicies.filter((p) => {
          if (where?.id?.not && p.id === where.id.not) return false;
          if (where?.isActive !== undefined && p.isActive !== where.isActive) return false;
          if (where?.tier && p.tier !== where.tier) return false;
          return true;
        });
        return results;
      }),
      count: vi.fn(async ({ where }: any) => {
        let results = discountPolicies.filter((p) => {
          if (where?.isActive !== undefined && p.isActive !== where.isActive) return false;
          if (where?.tier && p.tier !== where.tier) return false;
          return true;
        });
        return results.length;
      }),
      create: vi.fn(async ({ data }: any) => {
        const newRecord = {
          id: `policy-${discountPolicies.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        discountPolicies.push(newRecord);
        return newRecord;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = discountPolicies.find((p) => p.id === where.id);
        if (!item) throw new Error(`DiscountPolicy ${where.id} not found`);
        Object.assign(item, data, { updatedAt: new Date() });
        return { ...item };
      }),
      delete: vi.fn(async ({ where }: any) => {
        const index = discountPolicies.findIndex((p) => p.id === where.id);
        if (index === -1) throw new Error(`DiscountPolicy ${where.id} not found`);
        const [deleted] = discountPolicies.splice(index, 1);
        return deleted;
      }),
    },
    approvalRule: {
      findUnique: vi.fn(async ({ where }: any) => {
        return (
          approvalRules.find(
            (r) => r.id === where.id || (where.name && r.name === where.name),
          ) ?? null
        );
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return approvalRules.filter((r) => {
          if (where?.id?.not && r.id === where.id.not) return false;
          if (where?.isActive !== undefined && r.isActive !== where.isActive) return false;
          if (where?.stage !== undefined && r.stage !== where.stage) return false;
          return true;
        });
      }),
      count: vi.fn(async ({ where }: any) => {
        return approvalRules.filter((r) => {
          if (where?.isActive !== undefined && r.isActive !== where.isActive) return false;
          if (where?.stage !== undefined && r.stage !== where.stage) return false;
          return true;
        }).length;
      }),
      create: vi.fn(async ({ data }: any) => {
        const newRecord = {
          id: `rule-${approvalRules.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        approvalRules.push(newRecord);
        return newRecord;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = approvalRules.find((r) => r.id === where.id);
        if (!item) throw new Error(`ApprovalRule ${where.id} not found`);
        Object.assign(item, data, { updatedAt: new Date() });
        return { ...item };
      }),
      delete: vi.fn(async ({ where }: any) => {
        const index = approvalRules.findIndex((r) => r.id === where.id);
        if (index === -1) throw new Error(`ApprovalRule ${where.id} not found`);
        const [deleted] = approvalRules.splice(index, 1);
        return deleted;
      }),
    },
    category: {
      findFirst: vi.fn(async ({ where }: any) => {
        const nameQuery = where?.name?.equals?.toLowerCase();
        return categories.find((c) => c.name.toLowerCase() === nameQuery) ?? null;
      }),
      count: vi.fn(async () => categories.length),
    },
    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        const record = {
          id: `audit-${auditLogs.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        auditLogs.push(record);
        return record;
      }),
      findMany: vi.fn(async () => auditLogs),
    },
    _state: {
      discountPolicies,
      approvalRules,
      categories,
      auditLogs,
    },
  };

  return client;
}
