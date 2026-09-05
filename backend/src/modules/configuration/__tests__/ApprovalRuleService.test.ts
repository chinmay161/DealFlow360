import { describe, it, expect, beforeEach } from "vitest";
import { ApprovalRuleService } from "../services/ApprovalRuleService.js";
import { EntityNotFoundError } from "../utils/errors.js";
import { createMockPrisma } from "./helpers.js";

describe("ApprovalRuleService", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: ApprovalRuleService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ApprovalRuleService(prisma);
  });

  describe("create", () => {
    it("creates a multi-stage approval rule and writes AuditLog", async () => {
      const rule = await service.create(
        {
          approvalLevel: "FINANCE",
          stage: 2,
          threshold: 0.20,
          riskThreshold: 60,
          minimumQuotationValue: 50000,
          maximumQuotationValue: 200000,
          priority: 2,
          active: true,
        },
        "user-admin-1",
      );

      expect(rule.id).toBeDefined();
      expect(rule.approvalLevel).toBe("FINANCE");
      expect(rule.stage).toBe(2);
      expect(rule.threshold).toBe(0.20);
      expect(rule.riskThreshold).toBe(60);
      expect(rule.priority).toBe(2);

      // Verify AuditLog
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entity: "ApprovalRule",
            action: "CREATE",
            userId: "user-admin-1",
          }),
        }),
      );
    });
  });

  describe("update", () => {
    it("updates existing approval rule and writes AuditLog", async () => {
      const updated = await service.update(
        "rule-1",
        {
          riskThreshold: 40,
          priority: 3,
        },
        "user-admin-1",
      );

      expect(updated.riskThreshold).toBe(40);
      expect(updated.priority).toBe(3);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entity: "ApprovalRule",
            action: "UPDATE",
            entityId: "rule-1",
          }),
        }),
      );
    });

    it("throws EntityNotFoundError when updating non-existent rule", async () => {
      await expect(
        service.update("rule-ghost", { priority: 2 }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe("delete", () => {
    it("deletes rule and writes AuditLog", async () => {
      await service.delete("rule-1", "user-admin-1");

      expect(prisma.approvalRule.delete).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entity: "ApprovalRule",
            action: "DELETE",
            entityId: "rule-1",
          }),
        }),
      );
    });

    it("throws EntityNotFoundError when deleting non-existent rule", async () => {
      await expect(service.delete("rule-ghost")).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe("getById", () => {
    it("retrieves rule by ID", async () => {
      const rule = await service.getById("rule-1");
      expect(rule.id).toBe("rule-1");
      expect(rule.approvalLevel).toBe("MANAGER");
      expect(rule.stage).toBe(1);
    });

    it("throws EntityNotFoundError when rule not found", async () => {
      await expect(service.getById("rule-unknown")).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe("list & pagination", () => {
    it("filters rules by stage and level", async () => {
      prisma._state.approvalRules.push({
        id: "rule-2",
        name: "Stage 2 Finance Approval Rule",
        description: JSON.stringify({ approvalLevel: "FINANCE" }),
        stage: 2,
        threshold: 0.20,
        approverRole: "FINANCE",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const stage1Result = await service.list({ stage: 1 });
      expect(stage1Result.items).toHaveLength(1);
      expect(stage1Result.items[0].stage).toBe(1);

      const financeResult = await service.list({ level: "FINANCE" });
      expect(financeResult.items).toHaveLength(1);
      expect(financeResult.items[0].approvalLevel).toBe("FINANCE");
    });
  });
});
