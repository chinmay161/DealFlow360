/**
 * Audit Logging Module — Test Helpers & Stateful Mock Prisma Client
 */

import { vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

export interface MockAuditDbRecord {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export function mockAuditRecord(overrides: Partial<MockAuditDbRecord> = {}): MockAuditDbRecord {
  return {
    id: `audit-${Math.random().toString(36).substring(2, 9)}`,
    userId: "user-123",
    action: "UPDATE",
    entity: "QUOTATION",
    entityId: "quote-456",
    oldValue: null,
    newValue: {
      granularAction: "QUOTATION_SUBMITTED",
      metadata: { totalAmount: 50000, margin: 0.22 },
      requestId: "req-abc-789",
    },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 TestAgent",
    createdAt: new Date("2026-03-01T12:00:00.000Z"),
    ...overrides,
  };
}

export function createMockAuditPrisma(initialLogs: MockAuditDbRecord[] = []) {
  const auditLogs: MockAuditDbRecord[] = [...initialLogs];
  let shouldFailNextCreate = false;
  let shouldFailNextFind = false;

  const client: any = {
    auditLog: {
      create: vi.fn(async ({ data }: { data: any }) => {
        if (shouldFailNextCreate) {
          throw new Error("Database connection failure during audit log insertion");
        }
        const record: MockAuditDbRecord = {
          id: `audit-${auditLogs.length + 1}`,
          userId: data.userId ?? null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldValue: data.oldValue ?? null,
          newValue: data.newValue ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          createdAt: new Date(),
        };
        auditLogs.push(record);
        return record;
      }),

      findMany: vi.fn(async ({ where, orderBy, skip = 0, take }: any = {}) => {
        if (shouldFailNextFind) {
          throw new Error("Database query execution error");
        }

        let results = [...auditLogs];

        // Apply where filters
        if (where) {
          if (where.entity) {
            const entityQuery =
              typeof where.entity === "string" ? where.entity : where.entity?.equals;
            if (entityQuery) {
              results = results.filter((r) => r.entity.toLowerCase() === entityQuery.toLowerCase());
            }
          }
          if (where.entityId) {
            results = results.filter((r) => r.entityId === where.entityId);
          }
          if (where.userId) {
            results = results.filter((r) => r.userId === where.userId);
          }
          if (where.action) {
            results = results.filter((r) => {
              if (r.action === where.action) return true;
              try {
                const parsed = typeof r.newValue === "string" ? JSON.parse(r.newValue) : r.newValue;
                return parsed?.granularAction === where.action;
              } catch {
                return false;
              }
            });
          }
          if (where.createdAt) {
            if (where.createdAt.gte) {
              results = results.filter((r) => r.createdAt >= where.createdAt.gte);
            }
            if (where.createdAt.lte) {
              results = results.filter((r) => r.createdAt <= where.createdAt.lte);
            }
          }
        }

        // Apply orderBy
        if (orderBy?.createdAt === "desc") {
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (orderBy?.createdAt === "asc") {
          results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        // Apply pagination
        if (typeof skip === "number" && skip > 0) {
          results = results.slice(skip);
        }
        if (typeof take === "number" && take > 0) {
          results = results.slice(0, take);
        }

        return results;
      }),

      count: vi.fn(async ({ where }: any = {}) => {
        if (shouldFailNextFind) {
          throw new Error("Database count query error");
        }

        let results = [...auditLogs];
        if (where) {
          if (where.entity) {
            const entityQuery =
              typeof where.entity === "string" ? where.entity : where.entity?.equals;
            if (entityQuery) {
              results = results.filter((r) => r.entity.toLowerCase() === entityQuery.toLowerCase());
            }
          }
          if (where.entityId) {
            results = results.filter((r) => r.entityId === where.entityId);
          }
          if (where.userId) {
            results = results.filter((r) => r.userId === where.userId);
          }
          if (where.action) {
            results = results.filter((r) => {
              if (r.action === where.action) return true;
              try {
                const parsed = typeof r.newValue === "string" ? JSON.parse(r.newValue) : r.newValue;
                return parsed?.granularAction === where.action;
              } catch {
                return false;
              }
            });
          }
          if (where.createdAt) {
            if (where.createdAt.gte) {
              results = results.filter((r) => r.createdAt >= where.createdAt.gte);
            }
            if (where.createdAt.lte) {
              results = results.filter((r) => r.createdAt <= where.createdAt.lte);
            }
          }
        }
        return results.length;
      }),
    },
    _state: {
      auditLogs,
      setFailNextCreate: (fail: boolean) => {
        shouldFailNextCreate = fail;
      },
      setFailNextFind: (fail: boolean) => {
        shouldFailNextFind = fail;
      },
    },
  };

  return client as PrismaClient & { _state: typeof client._state };
}
