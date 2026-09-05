import { describe, it, expect, beforeEach } from "vitest";
import { ValidationService } from "../services/ValidationService.js";
import {
  ValidationError,
  DuplicateEntityError,
  RangeOverlapError,
} from "../utils/errors.js";
import { createMockPrisma } from "./helpers.js";

describe("ValidationService", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let validator: ValidationService;

  beforeEach(() => {
    prisma = createMockPrisma();
    validator = new ValidationService(prisma);
  });

  describe("Discount Policy Validation", () => {
    it("rejects negative maximum discount", async () => {
      await expect(
        validator.validateDiscountPolicy({
          productCategory: "Hardware",
          maximumDiscount: -0.05,
          minimumMargin: 0.20,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects maximum discount exceeding 1.00", async () => {
      await expect(
        validator.validateDiscountPolicy({
          productCategory: "Hardware",
          maximumDiscount: 1.25,
          minimumMargin: 0.20,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects percentage sum exceeding 1.00 (discount + margin > 1)", async () => {
      await expect(
        validator.validateDiscountPolicy({
          productCategory: "Hardware",
          maximumDiscount: 0.60,
          minimumMargin: 0.50, // 60% + 50% = 110%
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects invalid customer tier", async () => {
      await expect(
        validator.validateDiscountPolicy({
          customerTier: "PLATINUM",
          productCategory: "Hardware",
          maximumDiscount: 0.15,
          minimumMargin: 0.20,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects non-existent product category", async () => {
      await expect(
        validator.validateDiscountPolicy({
          productCategory: "Spaceships",
          maximumDiscount: 0.15,
          minimumMargin: 0.20,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects duplicate policy with identical tier, category, and indefinite dates", async () => {
      // Clear dates on existing policy to make it indefinite
      prisma._state.discountPolicies[0].description = JSON.stringify({
        category: "Hardware",
        minMargin: 0.15,
      });

      await expect(
        validator.validateDiscountPolicy({
          customerTier: "GOLD",
          productCategory: "Hardware",
          maximumDiscount: 0.20,
          minimumMargin: 0.15,
        }),
      ).rejects.toThrow(DuplicateEntityError);
    });

    it("rejects overlapping effective date periods for the same tier & category", async () => {
      // Existing policy: 2026-01-01 to 2026-12-31
      await expect(
        validator.validateDiscountPolicy({
          customerTier: "GOLD",
          productCategory: "Hardware",
          maximumDiscount: 0.10,
          minimumMargin: 0.20,
          effectiveDate: "2026-06-01",
          expiryDate: "2027-06-01",
        }),
      ).rejects.toThrow(RangeOverlapError);
    });

    it("permits non-overlapping date periods for the same tier & category", async () => {
      await expect(
        validator.validateDiscountPolicy({
          customerTier: "GOLD",
          productCategory: "Hardware",
          maximumDiscount: 0.10,
          minimumMargin: 0.20,
          effectiveDate: "2027-01-01",
          expiryDate: "2027-12-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Approval Rule Validation", () => {
    it("rejects stage less than 1", async () => {
      await expect(
        validator.validateApprovalRule({
          approvalLevel: "MANAGER",
          stage: 0,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects risk threshold exceeding 100", async () => {
      await expect(
        validator.validateApprovalRule({
          approvalLevel: "FINANCE",
          stage: 2,
          riskThreshold: 105,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects minimum quotation value exceeding maximum quotation value", async () => {
      await expect(
        validator.validateApprovalRule({
          approvalLevel: "MANAGER",
          stage: 1,
          minimumQuotationValue: 50000,
          maximumQuotationValue: 10000,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects overlapping quotation value ranges at the same level & stage", async () => {
      // Existing rule 1: Stage 1, MANAGER, range [10000, 50000]
      await expect(
        validator.validateApprovalRule({
          approvalLevel: "MANAGER",
          stage: 1,
          minimumQuotationValue: 30000,
          maximumQuotationValue: 80000,
        }),
      ).rejects.toThrow(RangeOverlapError);
    });

    it("permits non-overlapping quotation value ranges at the same stage", async () => {
      await expect(
        validator.validateApprovalRule({
          approvalLevel: "MANAGER",
          stage: 1,
          minimumQuotationValue: 60000,
          maximumQuotationValue: 100000,
        }),
      ).resolves.not.toThrow();
    });
  });
});
