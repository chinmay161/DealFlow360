/**
 * ApprovalRuleService
 *
 * Implements CRUD operations, filtering, pagination, multi-stage approval support,
 * and audit logging for Approval Rules.
 */

import type { PrismaClient, RoleType } from "@prisma/client";
import type {
  IApprovalRuleService,
  IValidationService,
  CreateApprovalRuleInput,
  UpdateApprovalRuleInput,
} from "../interfaces/interfaces.js";
import type {
  ApprovalRuleDomain,
  ApprovalRuleFilter,
  PaginationParams,
  PaginatedResult,
} from "../types/types.js";
import { ValidationService } from "./ValidationService.js";
import { EntityNotFoundError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-rule-service");

export class ApprovalRuleService implements IApprovalRuleService {
  private readonly validator: IValidationService;

  constructor(
    private readonly prisma: PrismaClient,
    validator?: IValidationService,
  ) {
    this.validator = validator ?? new ValidationService(prisma);
  }

  /**
   * Create a new Approval Rule.
   */
  async create(
    data: CreateApprovalRuleInput,
    actorId = "system",
  ): Promise<ApprovalRuleDomain> {
    const startTime = performance.now();

    // 1. Validation
    await this.validator.validateApprovalRule(data);

    // 2. Resolve name
    const levelLabel = data.approvalLevel.toUpperCase();
    const baseName = data.name?.trim() || `Stage ${data.stage} ${levelLabel} Approval Rule`;
    const name = await this.resolveUniqueName(baseName);

    // 3. Map approvalLevel to approverRole
    const approverRole = this.mapLevelToRole(data.approvalLevel);

    // 4. Serialize metadata
    const meta = {
      approvalLevel: data.approvalLevel,
      riskThreshold: data.riskThreshold ?? null,
      minQuotationValue: data.minimumQuotationValue ?? null,
      maxQuotationValue: data.maximumQuotationValue ?? null,
      priority: data.priority ?? 1,
      userDescription: data.description ?? null,
    };

    const threshold =
      data.threshold !== undefined
        ? data.threshold
        : data.riskThreshold !== undefined && data.riskThreshold !== null
          ? data.riskThreshold / 100
          : 0.10;

    // 5. Persist to Prisma
    const created = await this.prisma.approvalRule.create({
      data: {
        name,
        description: JSON.stringify(meta),
        stage: data.stage,
        threshold,
        approverRole,
        isActive: data.active ?? true,
      },
    });

    // 6. Write AuditLog
    await this.createAuditLog(created.id, "CREATE", actorId, null, data);

    const executionTimeMs = Math.round(performance.now() - startTime);

    log.info(
      {
        ruleId: created.id,
        actor: actorId,
        action: "CREATE",
        executionTime: executionTimeMs,
      },
      "Approval rule created successfully",
    );

    return this.mapToDomain(created);
  }

  /**
   * Update an existing Approval Rule.
   */
  async update(
    id: string,
    data: UpdateApprovalRuleInput,
    actorId = "system",
  ): Promise<ApprovalRuleDomain> {
    const startTime = performance.now();

    const existing = await this.prisma.approvalRule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new EntityNotFoundError("ApprovalRule", id);
    }

    const prevDomain = this.mapToDomain(existing);

    // Merge for validation
    const merged: CreateApprovalRuleInput = {
      name: data.name ?? prevDomain.name,
      approvalLevel: data.approvalLevel ?? prevDomain.approvalLevel,
      stage: data.stage ?? prevDomain.stage,
      threshold: data.threshold !== undefined ? data.threshold : prevDomain.threshold,
      riskThreshold: data.riskThreshold !== undefined ? data.riskThreshold : prevDomain.riskThreshold,
      minimumQuotationValue:
        data.minimumQuotationValue !== undefined ? data.minimumQuotationValue : prevDomain.minimumQuotationValue,
      maximumQuotationValue:
        data.maximumQuotationValue !== undefined ? data.maximumQuotationValue : prevDomain.maximumQuotationValue,
      priority: data.priority ?? prevDomain.priority,
      active: data.active !== undefined ? data.active : prevDomain.active,
      description: data.description ?? prevDomain.description,
    };

    await this.validator.validateApprovalRule(merged, id);

    // Serialize updated metadata
    const meta = {
      approvalLevel: merged.approvalLevel,
      riskThreshold: merged.riskThreshold,
      minQuotationValue: merged.minimumQuotationValue,
      maxQuotationValue: merged.maximumQuotationValue,
      priority: merged.priority,
      userDescription: merged.description,
    };

    const approverRole = data.approvalLevel
      ? this.mapLevelToRole(data.approvalLevel)
      : existing.approverRole;

    const threshold =
      data.threshold !== undefined
        ? data.threshold
        : data.riskThreshold !== undefined && data.riskThreshold !== null
          ? data.riskThreshold / 100
          : existing.threshold;

    const updated = await this.prisma.approvalRule.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        description: JSON.stringify(meta),
        ...(data.stage !== undefined ? { stage: data.stage } : {}),
        threshold,
        approverRole,
        ...(data.active !== undefined ? { isActive: data.active } : {}),
      },
    });

    // Write AuditLog
    await this.createAuditLog(id, "UPDATE", actorId, prevDomain, data);

    const executionTimeMs = Math.round(performance.now() - startTime);

    log.info(
      {
        ruleId: id,
        actor: actorId,
        action: "UPDATE",
        executionTime: executionTimeMs,
      },
      "Approval rule updated successfully",
    );

    return this.mapToDomain(updated);
  }

  /**
   * Delete an Approval Rule.
   */
  async delete(id: string, actorId = "system"): Promise<void> {
    const startTime = performance.now();

    const existing = await this.prisma.approvalRule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new EntityNotFoundError("ApprovalRule", id);
    }

    const prevDomain = this.mapToDomain(existing);

    try {
      await this.prisma.approvalRule.delete({
        where: { id },
      });
    } catch {
      // Soft-delete if relations exist
      await this.prisma.approvalRule.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Write AuditLog
    await this.createAuditLog(id, "DELETE", actorId, prevDomain, null);

    const executionTimeMs = Math.round(performance.now() - startTime);

    log.info(
      {
        ruleId: id,
        actor: actorId,
        action: "DELETE",
        executionTime: executionTimeMs,
      },
      "Approval rule deleted successfully",
    );
  }

  /**
   * Retrieve an Approval Rule by ID.
   */
  async getById(id: string): Promise<ApprovalRuleDomain> {
    const rule = await this.prisma.approvalRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new EntityNotFoundError("ApprovalRule", id);
    }

    return this.mapToDomain(rule);
  }

  /**
   * List Approval Rules with filtering and pagination.
   */
  async list(
    filter?: ApprovalRuleFilter,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ApprovalRuleDomain>> {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.max(1, Math.min(100, pagination?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter?.active !== undefined) {
      where.isActive = filter.active;
    }
    if (filter?.stage !== undefined) {
      where.stage = filter.stage;
    }

    const allRecords = await this.prisma.approvalRule.findMany({
      where,
      orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
    });

    let domainItems = allRecords.map((r) => this.mapToDomain(r));

    // In-memory filter for approval level if specified
    if (filter?.level) {
      const levelUpper = filter.level.toUpperCase();
      domainItems = domainItems.filter(
        (r) =>
          r.approvalLevel.toUpperCase() === levelUpper ||
          r.name.toUpperCase().includes(levelUpper),
      );
    }

    const total = domainItems.length;
    const paginatedItems = domainItems.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private mapToDomain(record: any): ApprovalRuleDomain {
    let meta: Record<string, any> = {};
    if (record.description) {
      try {
        meta = JSON.parse(record.description);
      } catch {
        meta = { userDescription: record.description };
      }
    }

    const level = meta.approvalLevel || record.approverRole || "MANAGER";
    const riskThreshold = meta.riskThreshold !== undefined ? Number(meta.riskThreshold) : null;
    const minQuotationValue = meta.minQuotationValue !== undefined ? Number(meta.minQuotationValue) : null;
    const maxQuotationValue = meta.maxQuotationValue !== undefined ? Number(meta.maxQuotationValue) : null;
    const priority = meta.priority !== undefined ? Number(meta.priority) : 1;

    return {
      id: record.id,
      name: record.name,
      description: meta.userDescription ?? undefined,
      approvalLevel: level,
      stage: record.stage,
      threshold: Number(record.threshold),
      riskThreshold,
      minimumQuotationValue: minQuotationValue,
      maximumQuotationValue: maxQuotationValue,
      priority,
      active: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapLevelToRole(level: string): RoleType {
    const norm = level.toUpperCase();
    switch (norm) {
      case "MANAGER":
        return "MANAGER" as RoleType;
      case "FINANCE":
        return "FINANCE" as RoleType;
      case "ADMIN":
      case "EXECUTIVE":
        return "ADMIN" as RoleType;
      default:
        return "MANAGER" as RoleType;
    }
  }

  private async resolveUniqueName(baseName: string): Promise<string> {
    let name = baseName;
    let count = 1;

    while (true) {
      const existing = await this.prisma.approvalRule.findUnique({
        where: { name },
      });
      if (!existing) return name;
      count++;
      name = `${baseName} (${count})`;
    }
  }

  private async createAuditLog(
    entityId: string,
    action: "CREATE" | "UPDATE" | "DELETE",
    userId: string,
    prevValue: any,
    newValue: any,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entity: "ApprovalRule",
          entityId,
          action,
          userId: userId && userId !== "system" ? userId : null,
          prevValue: prevValue ? prevValue : undefined,
          newValue: newValue ? newValue : undefined,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      log.warn({ entityId, action, err }, "Failed to write audit log for approval rule");
    }
  }
}
