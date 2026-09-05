/**
 * DiscountPolicyService
 *
 * Implements CRUD operations, filtering, pagination, and audit logging for Discount Policies.
 * Ensures the Rule Engine can immediately evaluate updated policies from the database.
 */

import type { PrismaClient } from "@prisma/client";
import type {
  IDiscountPolicyService,
  IValidationService,
  CreateDiscountPolicyInput,
  UpdateDiscountPolicyInput,
} from "../interfaces/interfaces.js";
import type {
  DiscountPolicyDomain,
  DiscountPolicyFilter,
  PaginationParams,
  PaginatedResult,
} from "../types/types.js";
import { ValidationService } from "./ValidationService.js";
import { EntityNotFoundError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("discount-policy-service");

export class DiscountPolicyService implements IDiscountPolicyService {
  private readonly validator: IValidationService;

  constructor(
    private readonly prisma: PrismaClient,
    validator?: IValidationService,
  ) {
    this.validator = validator ?? new ValidationService(prisma);
  }

  /**
   * Create a new Discount Policy.
   */
  async create(
    data: CreateDiscountPolicyInput,
    actorId = "system",
  ): Promise<DiscountPolicyDomain> {
    const startTime = performance.now();

    // 1. Validation
    await this.validator.validateDiscountPolicy(data);

    // 2. Generate unique name if not provided
    const tierLabel = data.customerTier ? String(data.customerTier).toUpperCase() : "All";
    const baseName = data.name?.trim() || `${data.productCategory} ${tierLabel} Discount Policy`;
    const name = await this.resolveUniqueName(baseName);

    // 3. Serialize metadata
    const meta = {
      category: data.productCategory,
      minMargin: data.minimumMargin,
      effectiveDate: data.effectiveDate ?? null,
      expiryDate: data.expiryDate ?? null,
      userDescription: data.description ?? null,
    };

    const tierValue =
      data.customerTier && data.customerTier !== "ALL" && data.customerTier !== "all"
        ? (String(data.customerTier).toUpperCase() as any)
        : null;

    // 4. Persist to Prisma
    const created = await this.prisma.discountPolicy.create({
      data: {
        name,
        description: JSON.stringify(meta),
        type: "PERCENTAGE",
        value: data.maximumDiscount,
        maxDiscount: 100000,
        tier: tierValue,
        isActive: data.active ?? true,
      },
    });

    // 5. Write AuditLog
    await this.createAuditLog(created.id, "CREATE", actorId, null, data);

    const executionTimeMs = Math.round(performance.now() - startTime);

    log.info(
      {
        policyId: created.id,
        actor: actorId,
        action: "CREATE",
        executionTime: executionTimeMs,
      },
      "Discount policy created successfully",
    );

    return this.mapToDomain(created);
  }

  /**
   * Update an existing Discount Policy.
   */
  async update(
    id: string,
    data: UpdateDiscountPolicyInput,
    actorId = "system",
  ): Promise<DiscountPolicyDomain> {
    const startTime = performance.now();

    // 1. Check existence
    const existing = await this.prisma.discountPolicy.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new EntityNotFoundError("DiscountPolicy", id);
    }

    const prevDomain = this.mapToDomain(existing);

    // 2. Merge inputs for validation
    const merged: CreateDiscountPolicyInput = {
      name: data.name ?? prevDomain.name,
      customerTier: data.customerTier !== undefined ? data.customerTier : prevDomain.customerTier,
      productCategory: data.productCategory ?? prevDomain.productCategory,
      maximumDiscount: data.maximumDiscount !== undefined ? data.maximumDiscount : prevDomain.maximumDiscount,
      minimumMargin: data.minimumMargin !== undefined ? data.minimumMargin : prevDomain.minimumMargin,
      active: data.active !== undefined ? data.active : prevDomain.active,
      effectiveDate: data.effectiveDate !== undefined ? data.effectiveDate : prevDomain.effectiveDate,
      expiryDate: data.expiryDate !== undefined ? data.expiryDate : prevDomain.expiryDate,
      description: data.description ?? prevDomain.description,
    };

    await this.validator.validateDiscountPolicy(merged, id);

    // 3. Serialize updated metadata
    const meta = {
      category: merged.productCategory,
      minMargin: merged.minimumMargin,
      effectiveDate: merged.effectiveDate ?? null,
      expiryDate: merged.expiryDate ?? null,
      userDescription: merged.description ?? null,
    };

    const tierValue =
      merged.customerTier && merged.customerTier !== "ALL" && merged.customerTier !== "all"
        ? (String(merged.customerTier).toUpperCase() as any)
        : null;

    // 4. Update in database
    const updated = await this.prisma.discountPolicy.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        description: JSON.stringify(meta),
        ...(data.maximumDiscount !== undefined ? { value: data.maximumDiscount } : {}),
        ...(data.customerTier !== undefined ? { tier: tierValue } : {}),
        ...(data.active !== undefined ? { isActive: data.active } : {}),
      },
    });

    // 5. AuditLog
    await this.createAuditLog(id, "UPDATE", actorId, prevDomain, data);

    const executionTimeMs = Math.round(performance.now() - startTime);

    log.info(
      {
        policyId: id,
        actor: actorId,
        action: "UPDATE",
        executionTime: executionTimeMs,
      },
      "Discount policy updated successfully",
    );

    return this.mapToDomain(updated);
  }

  /**
   * Delete a Discount Policy.
   */
  async delete(id: string, actorId = "system"): Promise<void> {
    const startTime = performance.now();

    const existing = await this.prisma.discountPolicy.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new EntityNotFoundError("DiscountPolicy", id);
    }

    const prevDomain = this.mapToDomain(existing);

    try {
      await this.prisma.discountPolicy.delete({
        where: { id },
      });
    } catch {
      // If foreign keys prevent hard deletion, soft delete
      await this.prisma.discountPolicy.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Write AuditLog
    await this.createAuditLog(id, "DELETE", actorId, prevDomain, null);

    const executionTimeMs = Math.round(performance.now() - startTime);

    log.info(
      {
        policyId: id,
        actor: actorId,
        action: "DELETE",
        executionTime: executionTimeMs,
      },
      "Discount policy deleted successfully",
    );
  }

  /**
   * Retrieve a Discount Policy by ID.
   */
  async getById(id: string): Promise<DiscountPolicyDomain> {
    const policy = await this.prisma.discountPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new EntityNotFoundError("DiscountPolicy", id);
    }

    return this.mapToDomain(policy);
  }

  /**
   * List Discount Policies with filtering and pagination.
   */
  async list(
    filter?: DiscountPolicyFilter,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<DiscountPolicyDomain>> {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.max(1, Math.min(100, pagination?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter?.active !== undefined) {
      where.isActive = filter.active;
    }
    if (filter?.customerTier) {
      where.tier = filter.customerTier.toUpperCase() as any;
    }

    const [allRecords, totalCount] = await Promise.all([
      this.prisma.discountPolicy.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.discountPolicy.count({ where }),
    ]);

    let domainItems = allRecords.map((r) => this.mapToDomain(r));

    // In-memory filter for category if specified
    if (filter?.category) {
      const catLower = filter.category.toLowerCase();
      domainItems = domainItems.filter(
        (p) =>
          p.productCategory.toLowerCase() === catLower ||
          p.name.toLowerCase().includes(catLower),
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

  private mapToDomain(record: any): DiscountPolicyDomain {
    let meta: Record<string, any> = {};
    if (record.description) {
      try {
        meta = JSON.parse(record.description);
      } catch {
        meta = { userDescription: record.description };
      }
    }

    // Category from metadata or first word of name
    const category = meta.category || record.name.split(" ")[0] || "General";
    const minMargin = meta.minMargin !== undefined ? Number(meta.minMargin) : 0.15;
    const effectiveDate = meta.effectiveDate ? new Date(meta.effectiveDate) : null;
    const expiryDate = meta.expiryDate ? new Date(meta.expiryDate) : null;

    return {
      id: record.id,
      name: record.name,
      description: meta.userDescription ?? undefined,
      customerTier: record.tier,
      productCategory: category,
      maximumDiscount: Number(record.value),
      minimumMargin: minMargin,
      active: record.isActive,
      effectiveDate,
      expiryDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async resolveUniqueName(baseName: string): Promise<string> {
    let name = baseName;
    let count = 1;

    while (true) {
      const existing = await this.prisma.discountPolicy.findUnique({
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
          entity: "DiscountPolicy",
          entityId,
          action,
          userId: userId && userId !== "system" ? userId : null,
          prevValue: prevValue ? prevValue : undefined,
          newValue: newValue ? newValue : undefined,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      log.warn({ entityId, action, err }, "Failed to write audit log for discount policy");
    }
  }
}
