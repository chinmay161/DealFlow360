/**
 * Quotation State Machine — Test Helpers & Stateful Mock Prisma Client
 */

import { vi } from "vitest";
import type { RoleType } from "@prisma/client";
import { QuotationState } from "../types/types.js";

export function mockUser(overrides: Partial<any> = {}) {
  return {
    id: "user-rep-1",
    email: "rep@dealflow.com",
    firstName: "Rachel",
    lastName: "Rep",
    isActive: true,
    roleId: "role-rep",
    role: { id: "role-rep", name: "SALES_REP" as RoleType },
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function mockManagerUser(overrides: Partial<any> = {}) {
  return {
    id: "user-mgr-1",
    email: "manager@dealflow.com",
    firstName: "Sarah",
    lastName: "Manager",
    isActive: true,
    roleId: "role-mgr",
    role: { id: "role-mgr", name: "MANAGER" as RoleType },
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function mockFinanceUser(overrides: Partial<any> = {}) {
  return {
    id: "user-fin-1",
    email: "finance@dealflow.com",
    firstName: "Frank",
    lastName: "Finance",
    isActive: true,
    roleId: "role-fin",
    role: { id: "role-fin", name: "FINANCE" as RoleType },
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function mockAdminUser(overrides: Partial<any> = {}) {
  return {
    id: "user-admin-1",
    email: "admin@dealflow.com",
    firstName: "Alice",
    lastName: "Admin",
    isActive: true,
    roleId: "role-admin",
    role: { id: "role-admin", name: "ADMIN" as RoleType },
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function mockQuotation(overrides: Partial<any> = {}) {
  return {
    id: "quot-1",
    quoteNumber: "QT-2026-001",
    status: QuotationState.Draft,
    approvalState: "PENDING",
    subtotal: 10000,
    discountTotal: 1000,
    taxTotal: 1800,
    grandTotal: 10800,
    currency: "USD",
    customerId: "cust-1",
    salesRepId: "user-rep-1",
    approvals: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

/**
 * Creates an in-memory stateful mock Prisma client.
 */
export function createMockPrisma(initialData?: {
  quotations?: any[];
  users?: any[];
  approvals?: any[];
  auditLogs?: any[];
}) {
  const quotations = [...(initialData?.quotations ?? [mockQuotation()])];
  const users = [
    ...(initialData?.users ?? [
      mockUser(),
      mockManagerUser(),
      mockFinanceUser(),
      mockAdminUser(),
    ]),
  ];
  const approvals = [...(initialData?.approvals ?? [])];
  const auditLogs = [...(initialData?.auditLogs ?? [])];

  const client: any = {
    quotation: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const item =
          quotations.find(
            (q) => q.id === where.id || q.quoteNumber === where.quoteNumber,
          ) ?? null;
        if (!item) return null;

        if (include?.approvals) {
          const itemApprovals = approvals.filter((a) => a.quotationId === item.id);
          return { ...item, approvals: itemApprovals };
        }
        return { ...item };
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = quotations.find((q) => q.id === where.id);
        if (!item) throw new Error(`Quotation ${where.id} not found`);
        Object.assign(item, data, { updatedAt: new Date() });
        return { ...item };
      }),
    },
    user: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const found = users.find((u) => u.id === where.id || u.email === where.email);
        if (!found) return null;
        return { ...found };
      }),
    },
    approval: {
      findMany: vi.fn(async ({ where }: any) => {
        return approvals.filter((a) => {
          if (where?.quotationId && a.quotationId !== where.quotationId) return false;
          if (where?.status && a.status !== where.status) return false;
          return true;
        });
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        const user = users.find((u) => u.id === data.userId) ?? null;
        const entry = {
          id: `audit-${auditLogs.length + 1}`,
          createdAt: data.createdAt ?? new Date(),
          ...data,
          user,
        };
        auditLogs.push(entry);
        return entry;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return auditLogs
          .filter((l) => {
            if (where?.entity && l.entity !== where.entity) return false;
            if (where?.entityId && l.entityId !== where.entityId) return false;
            return true;
          })
          .map((l) => ({
            ...l,
            user: users.find((u) => u.id === l.userId) ?? null,
          }));
      }),
    },
    $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
      return cb(client);
    }),
    _state: {
      quotations,
      users,
      approvals,
      auditLogs,
    },
  };

  return client;
}
