/**
 * AuditQueryService
 *
 * Query engine for retrieving audit records:
 * - General search with filtering (action, entity, entityId, userId, date ranges)
 * - Sorting newest first by default
 * - Pagination (page, limit)
 * - Chronological entity timeline (e.g. Quotation full lifecycle)
 * - User activity timeline
 */

import type { PrismaClient } from "@prisma/client";
import type { IAuditQueryService } from "../interfaces/interfaces.js";
import type {
  AuditQueryFilters,
  PaginationParams,
  PaginatedAuditResult,
  AuditRecordDomain,
} from "../types/types.js";
import { AuditService } from "./AuditService.js";

export class AuditQueryService implements IAuditQueryService {
  private readonly mapper: AuditService;

  constructor(private readonly prisma: PrismaClient) {
    this.mapper = new AuditService(prisma);
  }

  /**
   * General query with filtering, newest-first sorting, and pagination.
   */
  async query(
    filters?: AuditQueryFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedAuditResult> {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.max(1, Math.min(100, pagination?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.entity) {
      where.entity = {
        equals: filters.entity,
        mode: "insensitive",
      };
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.createdAt.lte = new Date(filters.to);
      }
    }

    const hasCustomActionFilter = Boolean(filters?.action);

    const [records, totalCount] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        ...(hasCustomActionFilter ? {} : { skip, take: limit }),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    let domainItems = records.map((r) => this.mapper.mapToDomain(r));

    // In-memory filter for granular action if specified
    if (hasCustomActionFilter && filters?.action) {
      const actionQuery = filters.action.toUpperCase();
      domainItems = domainItems.filter(
        (i) =>
          i.action.toUpperCase() === actionQuery ||
          i.action.toUpperCase().includes(actionQuery),
      );
    }

    const total = hasCustomActionFilter ? domainItems.length : totalCount;
    const paginatedItems = hasCustomActionFilter
      ? domainItems.slice(skip, skip + limit)
      : domainItems;

    return {
      items: paginatedItems,
      total,
      totalCount: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || (total === 0 ? 0 : 1),
      hasMore: page * limit < total,
    };
  }

  /**
   * Retrieve the complete chronological history for an entity.
   */
  async getEntityTimeline(
    entity: string,
    entityId: string,
  ): Promise<AuditRecordDomain[]> {
    const records = await this.prisma.auditLog.findMany({
      where: {
        entity: {
          equals: entity,
          mode: "insensitive",
        },
        entityId,
      },
      orderBy: {
        createdAt: "asc", // Chronological progression
      },
    });

    return records.map((r) => this.mapper.mapToDomain(r));
  }

  /**
   * Retrieve all activity performed by a specific user.
   */
  async getUserActivity(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedAuditResult> {
    return this.query({ userId }, pagination);
  }
}
