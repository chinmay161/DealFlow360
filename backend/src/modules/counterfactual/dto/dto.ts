/**
 * Counterfactual Engine — DTOs & Validation Schemas
 */

import { z } from "zod";

export const QuotationIdParamSchema = z.object({
  quotationId: z
    .string()
    .min(1, "Quotation ID must not be empty"),
});

export const SimulationChangeItemSchema = z.object({
  lineId: z.string().optional(),
  lineNumber: z.number().int().positive().optional(),
  sku: z.string().optional(),
  field: z.enum(["discountPct", "unitPrice", "discount"], {
    errorMap: () => ({ message: 'Field must be one of "discountPct", "unitPrice", or "discount"' }),
  }),
  value: z.number({
    required_error: "Value is required and must be a number",
  }),
});

export const SimulateRecommendationSchema = z.object({
  quotationId: z
    .string({
      required_error: "quotationId is required",
    })
    .min(1, "quotationId must not be empty"),
  changes: z
    .array(SimulationChangeItemSchema, {
      required_error: "changes array is required",
    })
    .min(1, "At least one change must be provided for simulation"),
});

export type QuotationIdParamDto = z.infer<typeof QuotationIdParamSchema>;
export type SimulationChangeItemDto = z.infer<typeof SimulationChangeItemSchema>;
export type SimulateRecommendationDto = z.infer<typeof SimulateRecommendationSchema>;
