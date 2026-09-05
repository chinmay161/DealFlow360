/**
 * Discount Configuration Module — Zod DTOs & Validation Schemas
 */

import { z } from "zod";

export const CustomerTierEnum = z.enum(["BRONZE", "SILVER", "GOLD"]);

export const ApprovalLevelEnum = z.enum([
  "MANAGER",
  "FINANCE",
  "EXECUTIVE",
  "ADMIN",
  "AUTO_APPROVE",
]);

// ── Discount Policy Schemas ───────────────────────────────────────────────────

export const CreateDiscountPolicySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    customerTier: z.union([CustomerTierEnum, z.literal("all"), z.literal("ALL")]).nullable().optional(),
    productCategory: z.string({
      required_error: "productCategory is required",
    }).trim().min(1, "productCategory cannot be empty"),
    maximumDiscount: z
      .number({
        required_error: "maximumDiscount is required",
      })
      .min(0, "maximumDiscount cannot be negative")
      .max(1, "maximumDiscount must be between 0.00 and 1.00 (e.g. 0.15 = 15%)"),
    minimumMargin: z
      .number({
        required_error: "minimumMargin is required",
      })
      .min(0, "minimumMargin cannot be negative")
      .max(1, "minimumMargin must be between 0.00 and 1.00 (e.g. 0.20 = 20%)"),
    active: z.boolean().optional().default(true),
    effectiveDate: z.coerce.date().nullable().optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => data.maximumDiscount + data.minimumMargin <= 1,
    {
      message: "The sum of maximumDiscount and minimumMargin cannot exceed 1.00 (100%)",
      path: ["maximumDiscount"],
    },
  )
  .refine(
    (data) => {
      if (data.effectiveDate && data.expiryDate) {
        return data.effectiveDate <= data.expiryDate;
      }
      return true;
    },
    {
      message: "expiryDate must be on or after effectiveDate",
      path: ["expiryDate"],
    },
  );

export type CreateDiscountPolicyDto = z.infer<typeof CreateDiscountPolicySchema>;

export const UpdateDiscountPolicySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    customerTier: z.union([CustomerTierEnum, z.literal("all"), z.literal("ALL")]).nullable().optional(),
    productCategory: z.string().trim().min(1).optional(),
    maximumDiscount: z
      .number()
      .min(0, "maximumDiscount cannot be negative")
      .max(1, "maximumDiscount must be between 0.00 and 1.00")
      .optional(),
    minimumMargin: z
      .number()
      .min(0, "minimumMargin cannot be negative")
      .max(1, "minimumMargin must be between 0.00 and 1.00")
      .optional(),
    active: z.boolean().optional(),
    effectiveDate: z.coerce.date().nullable().optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.maximumDiscount !== undefined && data.minimumMargin !== undefined) {
        return data.maximumDiscount + data.minimumMargin <= 1;
      }
      return true;
    },
    {
      message: "The sum of maximumDiscount and minimumMargin cannot exceed 1.00",
      path: ["maximumDiscount"],
    },
  )
  .refine(
    (data) => {
      if (data.effectiveDate && data.expiryDate) {
        return data.effectiveDate <= data.expiryDate;
      }
      return true;
    },
    {
      message: "expiryDate must be on or after effectiveDate",
      path: ["expiryDate"],
    },
  );

export type UpdateDiscountPolicyDto = z.infer<typeof UpdateDiscountPolicySchema>;

// ── Approval Rule Schemas ─────────────────────────────────────────────────────

export const CreateApprovalRuleSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    approvalLevel: ApprovalLevelEnum,
    stage: z.number().int().min(1, "stage must be at least 1"),
    threshold: z.number().min(0).max(1).optional(),
    riskThreshold: z.number().min(0).max(100).nullable().optional(),
    minimumQuotationValue: z.number().min(0).nullable().optional(),
    maximumQuotationValue: z.number().min(0).nullable().optional(),
    priority: z.number().int().min(1).optional().default(1),
    active: z.boolean().optional().default(true),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.minimumQuotationValue !== null &&
        data.minimumQuotationValue !== undefined &&
        data.maximumQuotationValue !== null &&
        data.maximumQuotationValue !== undefined
      ) {
        return data.minimumQuotationValue <= data.maximumQuotationValue;
      }
      return true;
    },
    {
      message: "maximumQuotationValue must be greater than or equal to minimumQuotationValue",
      path: ["maximumQuotationValue"],
    },
  );

export type CreateApprovalRuleDto = z.infer<typeof CreateApprovalRuleSchema>;

export const UpdateApprovalRuleSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    approvalLevel: ApprovalLevelEnum.optional(),
    stage: z.number().int().min(1).optional(),
    threshold: z.number().min(0).max(1).optional(),
    riskThreshold: z.number().min(0).max(100).nullable().optional(),
    minimumQuotationValue: z.number().min(0).nullable().optional(),
    maximumQuotationValue: z.number().min(0).nullable().optional(),
    priority: z.number().int().min(1).optional(),
    active: z.boolean().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.minimumQuotationValue !== null &&
        data.minimumQuotationValue !== undefined &&
        data.maximumQuotationValue !== null &&
        data.maximumQuotationValue !== undefined
      ) {
        return data.minimumQuotationValue <= data.maximumQuotationValue;
      }
      return true;
    },
    {
      message: "maximumQuotationValue must be greater than or equal to minimumQuotationValue",
      path: ["maximumQuotationValue"],
    },
  );

export type UpdateApprovalRuleDto = z.infer<typeof UpdateApprovalRuleSchema>;

// ── Query Parameter Schemas ───────────────────────────────────────────────────

export const DiscountPolicyQuerySchema = z.object({
  customerTier: z.string().optional(),
  category: z.string().optional(),
  active: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type DiscountPolicyQueryDto = z.infer<typeof DiscountPolicyQuerySchema>;

export const ApprovalRuleQuerySchema = z.object({
  level: z.string().optional(),
  active: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  stage: z.coerce.number().int().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ApprovalRuleQueryDto = z.infer<typeof ApprovalRuleQuerySchema>;

export const IdParamSchema = z.object({
  id: z.string().min(1, "ID parameter is required"),
});
