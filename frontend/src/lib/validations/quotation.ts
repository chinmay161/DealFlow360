import { z } from "zod";

export const AddLineItemSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID"),
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  discountPercent: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").default(0),
  unitPriceOverride: z.number().positive("Unit price must be positive").optional(),
});

export type AddLineItemInput = z.infer<typeof AddLineItemSchema>;

export const UpdateLineItemSchema = z.object({
  lineItemId: z.string().uuid("Invalid line item ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0").optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  unitPriceOverride: z.number().positive().optional(),
});

export type UpdateLineItemInput = z.infer<typeof UpdateLineItemSchema>;

export const RemoveLineItemSchema = z.object({
  lineItemId: z.string().uuid("Invalid line item ID"),
});

export type RemoveLineItemInput = z.infer<typeof RemoveLineItemSchema>;

export const SwitchCustomerSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID"),
  customerId: z.string().uuid("Invalid customer ID"),
});

export type SwitchCustomerInput = z.infer<typeof SwitchCustomerSchema>;

export const QuickAddBundleSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID"),
  bundleType: z.enum(["WORKSTATION_PRO", "CLOUD_STARTER", "COLLABORATION_SUITE"]),
});

export type QuickAddBundleInput = z.infer<typeof QuickAddBundleSchema>;

export const SubmitForApprovalSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID"),
  notes: z.string().max(500).optional(),
});

export type SubmitForApprovalInput = z.infer<typeof SubmitForApprovalSchema>;

export const CreateQuotationSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  contactId: z.string().uuid("Invalid contact ID").optional().nullable(),
  currency: z.string().default("INR"),
  paymentTerms: z.string().optional().default("Net 30 Days"),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;

