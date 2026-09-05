/**
 * ApprovalAssignmentService — Unit Tests
 *
 * Tests approver discovery, role-based assignment, strategy swapping,
 * and error handling when no active approver exists.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ApprovalAssignmentService,
  FirstActiveApproverStrategy,
} from "../services/ApprovalAssignmentService.js";
import type { ApproverAssignmentStrategy } from "../services/ApprovalAssignmentService.js";
import { ApproverNotFoundError } from "../utils/errors.js";
import { createMockPrisma, mockUser, mockFinanceUser } from "./helpers.js";

describe("ApprovalAssignmentService", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma({
      users: [
        mockUser({ id: "mgr-1", email: "mgr1@test.com", isActive: true }),
        mockFinanceUser({ id: "fin-1", email: "fin1@test.com", isActive: true }),
      ],
    });
  });

  it("assigns first active manager using default strategy", async () => {
    const service = new ApprovalAssignmentService(mockPrisma);
    const approver = await service.assignApprover("MANAGER");

    expect(approver.id).toBe("mgr-1");
    expect(approver.role).toBe("MANAGER");
  });

  it("assigns first active finance user using default strategy", async () => {
    const service = new ApprovalAssignmentService(mockPrisma);
    const approver = await service.assignApprover("FINANCE");

    expect(approver.id).toBe("fin-1");
    expect(approver.role).toBe("FINANCE");
  });

  it("throws ApproverNotFoundError if no active approver found for role", async () => {
    const service = new ApprovalAssignmentService(mockPrisma);

    await expect(service.assignApprover("ADMIN", { quotationId: "quot-1" })).rejects.toThrow(
      ApproverNotFoundError,
    );
  });

  it("allows swapping assignment strategy dynamically", async () => {
    const customStrategy: ApproverAssignmentStrategy = {
      findApprover: vi.fn().mockResolvedValue({
        id: "custom-user-99",
        email: "custom@test.com",
        firstName: "Custom",
        lastName: "Approver",
        role: "MANAGER",
      }),
    };

    const service = new ApprovalAssignmentService(mockPrisma);
    service.setStrategy(customStrategy);

    const approver = await service.assignApprover("MANAGER");

    expect(customStrategy.findApprover).toHaveBeenCalledWith("MANAGER", undefined);
    expect(approver.id).toBe("custom-user-99");
  });
});
