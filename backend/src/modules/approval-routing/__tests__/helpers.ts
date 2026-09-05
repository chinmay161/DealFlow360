/**
 * Approval Routing — Test Helpers & Mock Prisma Factory
 */

import { vi } from "vitest";
import type { RoleType, QuotationStatus, ApprovalStatus, ApprovalAction } from "@prisma/client";

export function mockUser(overrides: Partial<any> = {}) {
  return {
    id: "user-mgr-1",
    email: "manager@dealflow.com",
    firstName: "Sarah",
    lastName: "Manager",
    isActive: true,
    roleId: "role-mgr",
    role: { id: "role-mgr", name: "MANAGER" as RoleType },
    createdAt: new Date("2024-01-01"),
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
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function mockAdminUser(overrides: Partial<any> = {}) {
  return {
    id: "user-exec-1",
    email: "admin@dealflow.com",
    firstName: "Alice",
    lastName: "Admin",
    isActive: true,
    roleId: "role-admin",
    role: { id: "role-admin", name: "ADMIN" as RoleType },
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function mockQuotation(overrides: Partial<any> = {}) {
  return {
    id: "quot-1",
    quoteNumber: "QT-2024-001",
    status: "DRAFT" as QuotationStatus,
    approvalState: "PENDING" as ApprovalStatus,
    riskScore: 45,
    currency: "USD",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function mockApproval(overrides: Partial<any> = {}) {
  return {
    id: "appr-1",
    stage: 1,
    status: "PENDING" as ApprovalStatus,
    action: null as ApprovalAction | null,
    comments: null as string | null,
    decidedAt: null as Date | null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    quotationId: "quot-1",
    approverId: "user-mgr-1",
    approver: mockUser(),
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
  ruleEvaluations?: any[];
}) {
  const quotations = [...(initialData?.quotations ?? [mockQuotation()])];
  const users = [...(initialData?.users ?? [mockUser(), mockFinanceUser(), mockAdminUser()])];
  const approvals = [...(initialData?.approvals ?? [])];
  const auditLogs = [...(initialData?.auditLogs ?? [])];
  const ruleEvaluations = [...(initialData?.ruleEvaluations ?? [])];

  const client: any = {
    quotation: {
      findUnique: vi.fn(async ({ where }: any) => {
        return quotations.find((q) => q.id === where.id || q.quoteNumber === where.quoteNumber) ?? null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = quotations.find((q) => q.id === where.id);
        if (!item) throw new Error(`Quotation ${where.id} not found`);
        Object.assign(item, data, { updatedAt: new Date() });
        return { ...item };
      }),
    },
    user: {
      findFirst: vi.fn(async ({ where }: any) => {
        return (
          users.find((u) => {
            if (where.isActive !== undefined && u.isActive !== where.isActive) return false;
            if (where.role?.name && u.role?.name !== where.role.name) return false;
            return true;
          }) ?? null
        );
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        return users.find((u) => u.id === where.id) ?? null;
      }),
    },
    approval: {
      findUnique: vi.fn(async ({ where }: any) => {
        const found = approvals.find((a) => a.id === where.id);
        if (!found) return null;
        const quotation = quotations.find((q) => q.id === found.quotationId);
        const approver = users.find((u) => u.id === found.approverId);
        return { ...found, quotation, approver };
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return approvals
          .filter((a) => {
            if (where?.quotationId && a.quotationId !== where.quotationId) return false;
            if (where?.status && a.status !== where.status) return false;
            if (where?.approverId && a.approverId !== where.approverId) return false;
            if (where?.approver?.role?.name) {
              const u = users.find((usr) => usr.id === a.approverId);
              if (u?.role?.name !== where.approver.role.name) return false;
            }
            return true;
          })
          .map((a) => ({
            ...a,
            approver: users.find((u) => u.id === a.approverId) ?? mockUser(),
            quotation: quotations.find((q) => q.id === a.quotationId) ?? mockQuotation(),
          }));
      }),
      create: vi.fn(async ({ data }: any) => {
        const newApproval = {
          id: `appr-${approvals.length + 1}`,
          action: null,
          comments: null,
          decidedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        const approver = users.find((u) => u.id === data.approverId) ?? mockUser();
        const quotation = quotations.find((q) => q.id === data.quotationId) ?? mockQuotation();
        approvals.push(newApproval);
        return { ...newApproval, approver, quotation };
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = approvals.find((a) => a.id === where.id);
        if (!item) throw new Error(`Approval ${where.id} not found`);
        Object.assign(item, data, { updatedAt: new Date() });
        const approver = users.find((u) => u.id === (data.approverId ?? item.approverId)) ?? mockUser();
        const quotation = quotations.find((q) => q.id === item.quotationId) ?? mockQuotation();
        return { ...item, approver, quotation };
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        const entry = {
          id: `audit-${auditLogs.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        auditLogs.push(entry);
        return entry;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return auditLogs.filter((l) => {
          if (where?.entity && l.entity !== where.entity) return false;
          if (where?.entityId && l.entityId !== where.entityId) return false;
          return true;
        });
      }),
    },
    ruleEvaluation: {
      findFirst: vi.fn(async ({ where }: any) => {
        return (
          ruleEvaluations.find((r) => {
            if (where?.quotationId && r.quotationId !== where.quotationId) return false;
            if (where?.ruleName && r.ruleName !== where.ruleName) return false;
            return true;
          }) ?? null
        );
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return ruleEvaluations.filter((r) => {
          if (where?.quotationId && r.quotationId !== where.quotationId) return false;
          return true;
        });
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
      ruleEvaluations,
    },
  };

  return client;
}
