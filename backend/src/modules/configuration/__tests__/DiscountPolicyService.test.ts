import { describe, it, expect, beforeEach } from "vitest";
import { DiscountPolicyService } from "../services/DiscountPolicyService.js";
import { EntityNotFoundError } from "../utils/errors.js";
import { createMockPrisma } from "./helpers.js";

describe("DiscountPolicyService", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: DiscountPolicyService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DiscountPolicyService(prisma);
  });

  describe("create", () => {
    it("creates a new policy and writes AuditLog", async () => {
      const policy = await service.create(
        {
          productCategory: "Software",
          customerTier: "SILVER",
          maximumDiscount: 0.20,
          minimumMargin: 0.25,
          active: true,
        },
        "user-admin-1",
      );

      expect(policy.id).toBeDefined();
      expect(policy.productCategory).toBe("Software");
      expect(policy.customerTier).toBe("SILVER");
      expect(policy.maximumDiscount).toBe(0.20);
      expect(policy.minimumMargin).toBe(0.25);
      expect(policy.active).toBe(true);

      // Verify AuditLog
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entity: "DiscountPolicy",
            action: "CREATE",
            userId: "user-admin-1",
          }),
        }),
      );
    });
  });

  describe("update", () => {
    it("updates existing policy and writes AuditLog", async () => {
      const updated = await service.update(
        "policy-1",
        {
          maximumDiscount: 0.12,
          minimumMargin: 0.18,
        },
        "user-admin-1",
      );

      expect(updated.maximumDiscount).toBe(0.12);
      expect(updated.minimumMargin).toBe(0.18);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entity: "DiscountPolicy",
            action: "UPDATE",
            entityId: "policy-1",
          }),
        }),
      );
    });

    it("throws EntityNotFoundError when updating non-existent policy", async () => {
      await expect(
        service.update("policy-ghost", { maximumDiscount: 0.10 }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe("delete", () => {
    it("deletes policy and writes AuditLog", async () => {
      await service.delete("policy-1", "user-admin-1");

      expect(prisma.discountPolicy.delete).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entity: "DiscountPolicy",
            action: "DELETE",
            entityId: "policy-1",
          }),
        }),
      );
    });

    it("throws EntityNotFoundError when deleting non-existent policy", async () => {
      await expect(service.delete("policy-ghost")).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe("getById", () => {
    it("retrieves policy by ID", async () => {
      const policy = await service.getById("policy-1");
      expect(policy.id).toBe("policy-1");
      expect(policy.productCategory).toBe("Hardware");
    });

    it("throws EntityNotFoundError when policy is not found", async () => {
      await expect(service.getById("policy-unknown")).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe("list & pagination", () => {
    it("filters policies by customerTier and category", async () => {
      // Add extra policy
      prisma._state.discountPolicies.push({
        id: "policy-2",
        name: "Software Silver Discount Policy",
        description: JSON.stringify({ category: "Software", minMargin: 0.20 }),
        type: "PERCENTAGE",
        value: 0.25,
        tier: "SILVER",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const goldResult = await service.list({ customerTier: "GOLD" });
      expect(goldResult.items).toHaveLength(1);
      expect(goldResult.items[0].id).toBe("policy-1");

      const softwareResult = await service.list({ category: "Software" });
      expect(softwareResult.items).toHaveLength(1);
      expect(softwareResult.items[0].id).toBe("policy-2");
    });

    it("paginates results correctly", async () => {
      const res = await service.list({}, { page: 1, limit: 10 });
      expect(res.page).toBe(1);
      expect(res.limit).toBe(10);
      expect(res.total).toBeGreaterThanOrEqual(1);
      expect(res.items.length).toBeGreaterThanOrEqual(1);
    });
  });
});
