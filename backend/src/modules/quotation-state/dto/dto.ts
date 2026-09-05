/**
 * Quotation State Machine — Request & Response DTOs
 */

import { z } from "zod";

export const TransitionRequestSchema = z.object({
  targetState: z.string({
    required_error: "targetState is required",
    invalid_type_error: "targetState must be a string",
  }).min(1, "targetState cannot be empty"),
  reason: z.string().optional(),
  actorId: z.string().optional(),
});

export type TransitionRequestDto = z.infer<typeof TransitionRequestSchema>;

export const QuotationIdParamSchema = z.object({
  id: z.string({
    required_error: "Quotation ID parameter is required",
  }).min(1, "Quotation ID cannot be empty"),
});

export type QuotationIdParamDto = z.infer<typeof QuotationIdParamSchema>;
