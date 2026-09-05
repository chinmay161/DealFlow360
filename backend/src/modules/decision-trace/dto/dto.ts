/**
 * Decision Trace — DTO Schemas (Zod)
 *
 * Request validation schemas for all decision-trace endpoints.
 * Invalid input is caught at the controller layer before reaching services.
 */

import { z } from "zod";

// ─── GET /api/v1/quotations/:quotationId/decision-trace ──────────────────────

export const GetDecisionTraceQuerySchema = z.object({
  passed: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  failed: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  severity: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),
  rule: z.string().optional(),
  format: z
    .enum(["raw", "human"])
    .optional()
    .default("raw"),
});

export type GetDecisionTraceQuery = z.infer<typeof GetDecisionTraceQuerySchema>;

// ─── GET /api/v1/decision-traces/search ──────────────────────────────────────

export const SearchDecisionTraceQuerySchema = z.object({
  ruleName: z.string().optional(),
  ruleId: z.string().optional(),
  date: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(Date.parse(v)),
      { message: "Invalid date format. Use ISO 8601 (e.g. 2024-01-15)." },
    ),
  quotationId: z.string().optional(),
  outcome: z
    .enum(["PASS", "FAIL", "WARN", "SKIP"])
    .optional(),
});

export type SearchDecisionTraceQuery = z.infer<typeof SearchDecisionTraceQuerySchema>;

// ─── GET /api/v1/quotations/:quotationId/decision-trace/export ───────────────

export const ExportDecisionTraceQuerySchema = z.object({
  format: z
    .enum(["json", "csv"])
    .optional()
    .default("json"),
});

export type ExportDecisionTraceQuery = z.infer<typeof ExportDecisionTraceQuerySchema>;

// ─── Path Params ─────────────────────────────────────────────────────────────

export const QuotationIdParamSchema = z.object({
  quotationId: z.string().uuid("quotationId must be a valid UUID"),
});

export type QuotationIdParam = z.infer<typeof QuotationIdParamSchema>;
