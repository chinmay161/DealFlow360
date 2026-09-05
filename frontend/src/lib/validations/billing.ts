import { z } from "zod";

export const RecordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().positive("Payment amount must be greater than 0"),
  paymentMethod: z.enum(["Bank Transfer", "Credit Card", "ACH", "Other"]),
  reference: z.string().max(100).optional(),
});

export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

export const CreateCreditNoteSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().positive("Credit amount must be greater than 0"),
  reason: z.string().min(3, "Credit reason is required").max(500),
});

export type CreateCreditNoteInput = z.infer<typeof CreateCreditNoteSchema>;

export const UpdateSubscriptionQuantitySchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export type UpdateSubscriptionQuantityInput = z.infer<typeof UpdateSubscriptionQuantitySchema>;
