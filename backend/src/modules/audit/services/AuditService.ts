/**
 * AuditService
 *
 * Centralized, append-only, immutable audit logging service for DealFlow360.
 *
 * Guarantees:
 * - Append-only: audit logs are never updated or deleted.
 * - Fault tolerance: failure to write an audit log NEVER throws or crashes caller operations.
 * - Structured Pino logging with action, entity, entityId, requestId, and duration.
 */

import type { PrismaClient, AuditAction } from "@prisma/client";
import type { IAuditService } from "../interfaces/interfaces.js";
import type { LogAuditParams, AuditRecordDomain } from "../types/types.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("audit-service");

export class AuditService implements IAuditService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Log an audit event.
   *
   * @param params Audit parameters (userId, action, entity, entityId, metadata)
   * @returns The created AuditRecordDomain or null if persistence failed (safe/best-effort).
   */
  async log(params: LogAuditParams): Promise<AuditRecordDomain | null> {
    const startTime = performance.now();
    try {
      const client = params.tx ?? this.prisma;
      const prismaAction = this.mapToPrismaAction(params.action);

      const meta = params.metadata ?? {};
      const ip = params.ipAddress ?? meta.ip ?? meta.ipAddress ?? null;
      const userAgent = params.userAgent ?? meta.userAgent ?? null;

      const payload = {
        granularAction: params.action,
        action: params.action,
        requestId: params.requestId,
        metadata: meta,
      };

      const record = await client.auditLog.create({
        data: {
          entity: params.entity,
          entityId: params.entityId,
          action: prismaAction,
          userId: params.userId && params.userId !== "system" ? params.userId : null,
          ipAddress: ip,
          userAgent,
          newValue: payload,
          prevValue: meta.previousState ? { state: meta.previousState } : undefined,
          createdAt: new Date(),
        },
      });

      const duration = Math.round((performance.now() - startTime) * 100) / 100;

      log.info(
        {
          requestId: params.requestId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          duration,
        },
        "Audit event recorded",
      );

      return this.mapToDomain(record);
    } catch (error) {
      const duration = Math.round((performance.now() - startTime) * 100) / 100;
      log.error(
        {
          requestId: params.requestId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          duration,
          error,
        },
        "Failed to record audit event — continuing business execution safely",
      );
      return null;
    }
  }

  // ── Mapping Helpers ────────────────────────────────────────────────────────

  public mapToDomain(record: any): AuditRecordDomain {
    let newVal: any = {};
    if (typeof record.newValue === "string") {
      try {
        newVal = JSON.parse(record.newValue);
      } catch {
        newVal = {};
      }
    } else if (record.newValue && typeof record.newValue === "object") {
      newVal = record.newValue;
    }

    const customMetadata =
      newVal.metadata !== undefined
        ? newVal.metadata
        : (({ granularAction, action, requestId, ...rest }) => rest)(newVal);

    return {
      id: record.id,
      userId: record.userId,
      user: record.user
        ? {
            id: record.user.id,
            email: record.user.email,
            firstName: record.user.firstName,
            lastName: record.user.lastName,
            role: record.user.role?.name ?? record.user.roleId,
          }
        : undefined,
      action: newVal.granularAction || newVal.action || record.action,
      entity: record.entity,
      entityId: record.entityId,
      metadata: customMetadata,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      requestId: newVal.requestId ?? record.requestId,
      createdAt: record.createdAt,
    };
  }

  private mapToPrismaAction(action: string): AuditAction {
    const upper = action.toUpperCase();
    if (upper.includes("REJECT")) return "REJECT";
    if (upper.includes("APPROV")) return "APPROVE";
    if (upper.includes("LOGOUT")) return "LOGOUT";
    if (upper.includes("LOGIN")) return "LOGIN";
    if (upper.includes("EXPORT")) return "EXPORT";
    if (upper.includes("DELETE")) return "DELETE";
    if (upper.includes("CREATE")) return "CREATE";
    return "UPDATE";
  }
}
