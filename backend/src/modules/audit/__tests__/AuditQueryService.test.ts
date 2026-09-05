/**
 * AuditQueryService Test Suite
 *
 * Tests:
 * - Querying with action, entity, entityId, userId, date range filters
 * - Newest-first default sorting
 * - Pagination calculation (totalCount, totalPages, hasMore)
 * - Chronological entity lifecycle timeline
 * - User activity retrieval
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AuditQueryService } from "../services/AuditQueryService.js";
import { createMockAuditPrisma, mockAuditRecord } from "./helpers.js";

describe("AuditQueryService", () => {
  let mockPrisma: ReturnType<typeof createMockAuditPrisma>;
  let queryService: AuditQueryService;

  beforeEach(() => {
    const logs = [
      mockAuditRecord({
        id: "log-1",
        userId: "user-alice",
        action: "CREATE",
        entity: "QUOTATION",
        entityId: "qt-100",
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
        newValue: JSON.stringify({ granularAction: "QUOTATION_CREATED", metadata: { amount: 1000 } }),
      }),
      mockAuditRecord({
        id: "log-2",
        userId: "user-bob",
        action: "UPDATE",
        entity: "QUOTATION",
        entityId: "qt-100",
        createdAt: new Date("2026-03-01T11:00:00.000Z"),
        newValue: JSON.stringify({ granularAction: "DISCOUNT_APPLIED", metadata: { discount: 0.1 } }),
      }),
      mockAuditRecord({
        id: "log-3",
        userId: "user-alice",
        action: "APPROVE",
        entity: "APPROVAL_REQUEST",
        entityId: "ar-200",
        createdAt: new Date("2026-03-01T12:00:00.000Z"),
        newValue: JSON.stringify({ granularAction: "APPROVE", metadata: { approver: "user-alice" } }),
      }),
      mockAuditRecord({
        id: "log-4",
        userId: "user-carol",
        action: "DELETE",
        entity: "DISCOUNT_POLICY",
        entityId: "dp-300",
        createdAt: new Date("2026-03-02T09:00:00.000Z"),
        newValue: JSON.stringify({ granularAction: "POLICY_DELETED", metadata: {} }),
      }),
    ];

    mockPrisma = createMockAuditPrisma(logs);
    queryService = new AuditQueryService(mockPrisma);
  });

  describe("query()", () => {
    it("should return all records sorted newest first by default", async () => {
      const result = await queryService.query({}, { page: 1, limit: 10 });

      expect(result.totalCount).toBe(4);
      expect(result.items).toHaveLength(4);
      // Newest first: log-4 (March 2) should be first
      expect(result.items[0].id).toBe("log-4");
      expect(result.items[3].id).toBe("log-1");
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it("should filter by entity", async () => {
      const result = await queryService.query({ entity: "QUOTATION" });
      expect(result.totalCount).toBe(2);
      expect(result.items.every((i) => i.entity === "QUOTATION")).toBe(true);
    });

    it("should filter by entityId", async () => {
      const result = await queryService.query({ entityId: "qt-100" });
      expect(result.totalCount).toBe(2);
      expect(result.items.every((i) => i.entityId === "qt-100")).toBe(true);
    });

    it("should filter by userId", async () => {
      const result = await queryService.query({ userId: "user-alice" });
      expect(result.totalCount).toBe(2);
      expect(result.items.every((i) => i.userId === "user-alice")).toBe(true);
    });

    it("should filter by action", async () => {
      const result = await queryService.query({ action: "DELETE" });
      expect(result.totalCount).toBe(1);
      expect(result.items[0].action).toBe("POLICY_DELETED");
    });

    it("should filter by date range", async () => {
      const result = await queryService.query({
        from: new Date("2026-03-01T10:30:00.000Z"),
        to: new Date("2026-03-01T12:30:00.000Z"),
      });

      expect(result.totalCount).toBe(2);
      const ids = result.items.map((i) => i.id);
      expect(ids).toContain("log-2");
      expect(ids).toContain("log-3");
    });

    it("should paginate correctly", async () => {
      const page1 = await queryService.query({}, { page: 1, limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.totalCount).toBe(4);
      expect(page1.totalPages).toBe(2);
      expect(page1.hasMore).toBe(true);

      const page2 = await queryService.query({}, { page: 2, limit: 2 });
      expect(page2.items).toHaveLength(2);
      expect(page2.page).toBe(2);
      expect(page2.hasMore).toBe(false);

      // Verify no overlap
      const p1Ids = page1.items.map((i) => i.id);
      const p2Ids = page2.items.map((i) => i.id);
      expect(p1Ids.some((id) => p2Ids.includes(id))).toBe(false);
    });
  });

  describe("getEntityTimeline()", () => {
    it("should return chronological events for an entity (oldest first)", async () => {
      const timeline = await queryService.getEntityTimeline("QUOTATION", "qt-100");

      expect(timeline).toHaveLength(2);
      // Chronological: log-1 (10:00) before log-2 (11:00)
      expect(timeline[0].id).toBe("log-1");
      expect(timeline[1].id).toBe("log-2");
      expect(timeline[0].action).toBe("QUOTATION_CREATED");
      expect(timeline[1].action).toBe("DISCOUNT_APPLIED");
    });

    it("should return an empty array if entity has no audit events", async () => {
      const timeline = await queryService.getEntityTimeline("QUOTATION", "non-existent");
      expect(timeline).toEqual([]);
    });
  });

  describe("getUserActivity()", () => {
    it("should retrieve paginated user activity sorted newest first", async () => {
      const activity = await queryService.getUserActivity("user-alice", { page: 1, limit: 10 });

      expect(activity.totalCount).toBe(2);
      expect(activity.items).toHaveLength(2);
      expect(activity.items[0].id).toBe("log-3"); // 12:00
      expect(activity.items[1].id).toBe("log-1"); // 10:00
    });
  });
});
