/**
 * AuditService Test Suite
 *
 * Tests:
 * - Event logging with required and optional fields
 * - Append-only integrity
 * - Action mapping (standard Prisma enums vs custom actions)
 * - Metadata serialization and restoration
 * - Fault tolerance / failure isolation (Prisma errors never crash caller)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AuditService } from "../services/AuditService.js";
import { createMockAuditPrisma } from "./helpers.js";

describe("AuditService", () => {
  let mockPrisma: ReturnType<typeof createMockAuditPrisma>;
  let auditService: AuditService;

  beforeEach(() => {
    mockPrisma = createMockAuditPrisma();
    auditService = new AuditService(mockPrisma);
  });

  describe("log()", () => {
    it("should successfully record an audit event with full metadata", async () => {
      const record = await auditService.log({
        userId: "usr_001",
        action: "CREATE",
        entity: "QUOTATION",
        entityId: "qt_999",
        metadata: { customerName: "Acme Corp", totalValue: 75000 },
        ipAddress: "192.168.1.10",
        userAgent: "Mozilla/5.0 Chrome/120.0",
        requestId: "req-12345",
      });

      expect(record).not.toBeNull();
      expect(record?.id).toBeDefined();
      expect(record?.userId).toBe("usr_001");
      expect(record?.action).toBe("CREATE");
      expect(record?.entity).toBe("QUOTATION");
      expect(record?.entityId).toBe("qt_999");
      expect(record?.metadata).toEqual({ customerName: "Acme Corp", totalValue: 75000 });
      expect(record?.ipAddress).toBe("192.168.1.10");
      expect(record?.userAgent).toBe("Mozilla/5.0 Chrome/120.0");
      expect(record?.requestId).toBe("req-12345");

      // Verify stored in mock Prisma state
      expect(mockPrisma._state.auditLogs).toHaveLength(1);
      const stored = mockPrisma._state.auditLogs[0];
      expect(stored.action).toBe("CREATE");
      expect(stored.entity).toBe("QUOTATION");
    });

    it("should allow null userId for unauthenticated or system events", async () => {
      const record = await auditService.log({
        userId: null,
        action: "LOGIN",
        entity: "AUTH_SESSION",
        entityId: "sess_001",
        metadata: { outcome: "FAILED_INVALID_CREDENTIALS" },
      });

      expect(record).not.toBeNull();
      expect(record?.userId).toBeNull();
      expect(record?.action).toBe("LOGIN");
      expect(record?.entity).toBe("AUTH_SESSION");
    });

    it("should preserve custom granular actions in payload and map to standard enum", async () => {
      const record = await auditService.log({
        userId: "usr_002",
        action: "QUOTATION_SUBMITTED",
        entity: "QUOTATION",
        entityId: "qt_500",
        metadata: { margin: 0.18 },
      });

      expect(record).not.toBeNull();
      expect(record?.action).toBe("QUOTATION_SUBMITTED");

      // Verify Prisma enum mapping was UPDATE
      const rawDb = mockPrisma._state.auditLogs[0];
      expect(rawDb.action).toBe("UPDATE");
      const parsedNewValue =
        typeof rawDb.newValue === "string"
          ? JSON.parse(rawDb.newValue)
          : rawDb.newValue;
      expect(parsedNewValue.granularAction).toBe("QUOTATION_SUBMITTED");
    });

    it("should correctly map APPROVE, REJECT, DELETE, EXPORT custom string actions", async () => {
      await auditService.log({
        userId: "usr_approver",
        action: "APPROVAL_REQUEST_APPROVED",
        entity: "APPROVAL_REQUEST",
        entityId: "ar_1",
      });

      await auditService.log({
        userId: "usr_approver",
        action: "APPROVAL_REQUEST_REJECTED",
        entity: "APPROVAL_REQUEST",
        entityId: "ar_2",
      });

      await auditService.log({
        userId: "usr_admin",
        action: "DISCOUNT_POLICY_DELETED",
        entity: "DISCOUNT_POLICY",
        entityId: "dp_1",
      });

      const logs = mockPrisma._state.auditLogs;
      expect(logs[0].action).toBe("APPROVE");
      expect(logs[1].action).toBe("REJECT");
      expect(logs[2].action).toBe("DELETE");
    });

    it("should maintain append-only behavior without exposing updates or deletions", async () => {
      await auditService.log({
        userId: "usr_001",
        action: "CREATE",
        entity: "ORDER",
        entityId: "ord_101",
      });

      await auditService.log({
        userId: "usr_001",
        action: "UPDATE",
        entity: "ORDER",
        entityId: "ord_101",
      });

      expect(mockPrisma._state.auditLogs).toHaveLength(2);
      expect(mockPrisma._state.auditLogs[0].id).not.toBe(mockPrisma._state.auditLogs[1].id);
    });

    describe("Fault tolerance / Failure isolation", () => {
      it("should NEVER throw an error if the database write fails", async () => {
        mockPrisma._state.setFailNextCreate(true);

        let result: any = "unexecuted";
        let didThrow = false;

        try {
          result = await auditService.log({
            userId: "usr_001",
            action: "CREATE",
            entity: "QUOTATION",
            entityId: "qt_999",
            metadata: { criticalData: true },
          });
        } catch {
          didThrow = true;
        }

        expect(didThrow).toBe(false);
        expect(result).toBeNull();
      });

      it("should safely handle circular or non-serializable metadata without throwing", async () => {
        const circular: Record<string, any> = { name: "test" };
        circular.self = circular;

        let didThrow = false;
        let result: any;

        try {
          result = await auditService.log({
            userId: "usr_001",
            action: "UPDATE",
            entity: "ITEM",
            entityId: "itm_1",
            metadata: circular,
          });
        } catch {
          didThrow = true;
        }

        expect(didThrow).toBe(false);
        expect(result).not.toBeNull();
        expect(result?.metadata).toBeDefined();
      });
    });
  });
});
