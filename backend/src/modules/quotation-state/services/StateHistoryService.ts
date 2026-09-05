/**
 * StateHistoryService
 *
 * Maintains an immutable append-only transition audit history for quotations.
 * Persists transition snapshots to AuditLog and retrieves chronological timelines.
 */

import type { PrismaClient } from "@prisma/client";
import type { IStateHistoryService } from "../interfaces/interfaces.js";
import type { StateHistoryEntry, QuotationState } from "../types/types.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("quotation-state-history");

export class StateHistoryService implements IStateHistoryService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Record a state transition into the immutable audit log.
   */
  async recordTransition(
    entry: Omit<StateHistoryEntry, "id">,
    tx?: any,
  ): Promise<StateHistoryEntry> {
    const client = tx ?? this.prisma;
    const timestamp = entry.timestamp ?? new Date();

    const auditRecord = await client.auditLog.create({
      data: {
        entity: "QuotationState",
        entityId: entry.quotationId,
        action: "UPDATE",
        userId: entry.actorId && entry.actorId !== "system" ? entry.actorId : null,
        prevValue: {
          state: entry.previousState,
        },
        newValue: {
          state: entry.nextState,
          reason: entry.reason ?? null,
          metadata: entry.metadata ?? null,
          actorId: entry.actorId,
        },
        createdAt: timestamp,
      },
    });

    log.debug(
      {
        historyId: auditRecord.id,
        quotationId: entry.quotationId,
        previousState: entry.previousState,
        nextState: entry.nextState,
        actorId: entry.actorId,
      },
      "Recorded quotation state history entry",
    );

    return {
      id: auditRecord.id,
      quotationId: entry.quotationId,
      previousState: entry.previousState,
      nextState: entry.nextState,
      actorId: entry.actorId,
      actor: entry.actor,
      reason: entry.reason,
      timestamp,
      metadata: entry.metadata,
    };
  }

  /**
   * Retrieve the full chronological transition timeline for a quotation.
   */
  async getHistory(quotationId: string): Promise<StateHistoryEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entity: "QuotationState",
        entityId: quotationId,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return logs.map((record: any) => {
      const prev = (record.prevValue as any) ?? {};
      const next = (record.newValue as any) ?? {};

      return {
        id: record.id,
        quotationId: record.entityId,
        previousState: (prev.state as QuotationState) ?? "Unknown",
        nextState: (next.state as QuotationState) ?? "Unknown",
        actorId: record.userId ?? next.actorId ?? "system",
        actor: record.user
          ? {
              id: record.user.id,
              email: record.user.email,
              firstName: record.user.firstName,
              lastName: record.user.lastName,
              role: record.user.role?.name ?? record.user.roleId,
            }
          : undefined,
        reason: next.reason ?? undefined,
        timestamp: record.createdAt,
        metadata: next.metadata ?? undefined,
      };
    });
  }
}
