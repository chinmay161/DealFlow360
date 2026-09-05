/**
 * Audit Logging Module — Zod DTOs
 */

import { z } from "zod";

export const AuditQuerySchema = z.object({
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type AuditQueryDto = z.infer<typeof AuditQuerySchema>;

export const EntityTimelineParamSchema = z.object({
  entity: z.string().trim().min(1, "entity parameter is required"),
  entityId: z.string().trim().min(1, "entityId parameter is required"),
});

export type EntityTimelineParamDto = z.infer<typeof EntityTimelineParamSchema>;

export const UserIdParamSchema = z.object({
  userId: z.string().trim().min(1, "userId parameter is required"),
});

export type UserIdParamDto = z.infer<typeof UserIdParamSchema>;

export const LogAuditSchema = z.object({
  userId: z.string().nullable().optional(),
  action: z.string().min(1, "action cannot be empty"),
  entity: z.string().min(1, "entity cannot be empty"),
  entityId: z.string().min(1, "entityId cannot be empty"),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),
});

export type LogAuditDto = z.infer<typeof LogAuditSchema>;
