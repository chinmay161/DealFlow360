/**
 * ApprovalAssignmentService
 *
 * Discovers and assigns eligible approvers based on role and pluggable assignment strategies.
 * Defaults to FirstActiveApproverStrategy (first active user matching the role),
 * structured to support round-robin, load-balanced, or geography-based routing in the future.
 */

import type { PrismaClient, RoleType } from "@prisma/client";
import type { ApproverUserInfo } from "../types/types.js";
import { ApproverNotFoundError } from "../utils/errors.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("approval-assignment");

export interface AssignmentContext {
  quotationId?: string;
  stage?: number;
  tx?: any;
}

/**
 * Strategy interface for approver selection.
 */
export interface ApproverAssignmentStrategy {
  findApprover(role: RoleType, context?: AssignmentContext): Promise<ApproverUserInfo | null>;
}

/**
 * Default Strategy: First active user with the given role.
 */
export class FirstActiveApproverStrategy implements ApproverAssignmentStrategy {
  constructor(private readonly prisma: PrismaClient) {}

  async findApprover(
    role: RoleType,
    context?: AssignmentContext,
  ): Promise<ApproverUserInfo | null> {
    const client = context?.tx ?? this.prisma;

    const user = await client.user.findFirst({
      where: {
        isActive: true,
        role: {
          name: role,
        },
      },
      include: {
        role: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name as RoleType,
    };
  }
}

export class ApprovalAssignmentService {
  private strategy: ApproverAssignmentStrategy;

  constructor(
    private readonly prisma: PrismaClient,
    customStrategy?: ApproverAssignmentStrategy,
  ) {
    this.strategy = customStrategy ?? new FirstActiveApproverStrategy(prisma);
  }

  /**
   * Swap out the assignment strategy dynamically (e.g. for testing or switching to load balancer).
   */
  setStrategy(strategy: ApproverAssignmentStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Find and return an eligible approver for the specified role.
   * Throws ApproverNotFoundError if no active user satisfies the criteria.
   */
  async assignApprover(
    role: RoleType,
    context?: AssignmentContext,
  ): Promise<ApproverUserInfo> {
    log.debug({ role, quotationId: context?.quotationId, stage: context?.stage }, "Assigning approver");

    const approver = await this.strategy.findApprover(role, context);

    if (!approver) {
      log.warn({ role, quotationId: context?.quotationId }, "No eligible active approver found for role");
      throw new ApproverNotFoundError(role, context?.quotationId);
    }

    log.info(
      {
        role,
        approverId: approver.id,
        approverEmail: approver.email,
        quotationId: context?.quotationId,
      },
      "Approver assigned successfully",
    );

    return approver;
  }
}
