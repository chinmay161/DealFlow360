/**
 * ApprovalWorkflowService — Unit Tests
 *
 * Tests chain definitions, level normalization, final-stage checks,
 * and individual validation rules.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ApprovalWorkflowService } from "../services/ApprovalWorkflowService.js";
import {
  ApprovalAlreadyCompletedError,
  DuplicateApprovalError,
  UnauthorizedApproverError,
  InvalidWorkflowTransitionError,
  SkippedStageError,
} from "../utils/errors.js";
import { mockQuotation, mockApproval } from "./helpers.js";

describe("ApprovalWorkflowService", () => {
  let service: ApprovalWorkflowService;

  beforeEach(() => {
    service = new ApprovalWorkflowService();
  });

  describe("Chain Definitions & Stages", () => {
    it("returns empty chain for AUTO and AUTO_APPROVE", () => {
      expect(service.getChainDefinitions("AUTO")).toHaveLength(0);
      expect(service.getChainDefinitions("AUTO_APPROVE")).toHaveLength(0);
      expect(service.getTotalStages("AUTO")).toBe(0);
    });

    it("returns 1 stage for MANAGER", () => {
      const chain = service.getChainDefinitions("MANAGER");
      expect(chain).toHaveLength(1);
      expect(chain[0].stage).toBe(1);
      expect(chain[0].role).toBe("MANAGER");
      expect(service.getTotalStages("MANAGER")).toBe(1);
      expect(service.isFinalStage("MANAGER", 1)).toBe(true);
    });

    it("returns 2 stages for FINANCE", () => {
      const chain = service.getChainDefinitions("FINANCE");
      expect(chain).toHaveLength(2);
      expect(chain[0].stage).toBe(1);
      expect(chain[0].role).toBe("MANAGER");
      expect(chain[1].stage).toBe(2);
      expect(chain[1].role).toBe("FINANCE");
      expect(service.getTotalStages("FINANCE")).toBe(2);
      expect(service.isFinalStage("FINANCE", 1)).toBe(false);
      expect(service.isFinalStage("FINANCE", 2)).toBe(true);

      const nextStage = service.getNextStageDefinition("FINANCE", 1);
      expect(nextStage).toBeDefined();
      expect(nextStage?.stage).toBe(2);
      expect(nextStage?.role).toBe("FINANCE");
    });

    it("returns 3 stages for EXECUTIVE", () => {
      const chain = service.getChainDefinitions("EXECUTIVE");
      expect(chain).toHaveLength(3);
      expect(chain[0].role).toBe("MANAGER");
      expect(chain[1].role).toBe("FINANCE");
      expect(chain[2].role).toBe("ADMIN");
      expect(service.getTotalStages("EXECUTIVE")).toBe(3);
      expect(service.isFinalStage("EXECUTIVE", 2)).toBe(false);
      expect(service.isFinalStage("EXECUTIVE", 3)).toBe(true);
    });
  });

  describe("Validation: validateQuotationForStart", () => {
    it("allows DRAFT quotation to start workflow", () => {
      const quotation = mockQuotation({ status: "DRAFT" });
      expect(() => service.validateQuotationForStart(quotation)).not.toThrow();
    });

    it("allows PENDING_APPROVAL quotation to re-evaluate if in progress", () => {
      const quotation = mockQuotation({ status: "PENDING_APPROVAL" });
      expect(() => service.validateQuotationForStart(quotation)).not.toThrow();
    });

    it("throws 422 if quotation is already APPROVED", () => {
      const quotation = mockQuotation({ status: "APPROVED" });
      expect(() => service.validateQuotationForStart(quotation)).toThrow(
        InvalidWorkflowTransitionError,
      );
    });

    it("throws 422 if quotation is REJECTED", () => {
      const quotation = mockQuotation({ status: "REJECTED" });
      expect(() => service.validateQuotationForStart(quotation)).toThrow(
        InvalidWorkflowTransitionError,
      );
    });
  });

  describe("Validation: validateApprovalAction", () => {
    it("throws ApprovalAlreadyCompletedError if approval status is not PENDING", () => {
      const approval = mockApproval({ status: "APPROVED" });
      const quotation = mockQuotation({ status: "PENDING_APPROVAL" });

      expect(() =>
        service.validateApprovalAction({
          approval,
          approverId: approval.approverId,
          action: "APPROVE",
          quotation,
          existingApprovals: [approval],
        }),
      ).toThrow(ApprovalAlreadyCompletedError);
    });

    it("throws InvalidWorkflowTransitionError if quotation is already APPROVED", () => {
      const approval = mockApproval({ status: "PENDING" });
      const quotation = mockQuotation({ status: "APPROVED" });

      expect(() =>
        service.validateApprovalAction({
          approval,
          approverId: approval.approverId,
          action: "APPROVE",
          quotation,
          existingApprovals: [approval],
        }),
      ).toThrow(InvalidWorkflowTransitionError);
    });

    it("throws UnauthorizedApproverError if approverId does not match assignment", () => {
      const approval = mockApproval({ status: "PENDING", approverId: "assigned-user" });
      const quotation = mockQuotation({ status: "PENDING_APPROVAL" });

      expect(() =>
        service.validateApprovalAction({
          approval,
          approverId: "different-user",
          action: "APPROVE",
          quotation,
          existingApprovals: [approval],
        }),
      ).toThrow(UnauthorizedApproverError);
    });

    it("throws SkippedStageError if approving stage 2 before stage 1 is APPROVED", () => {
      const stage1 = mockApproval({ id: "appr-1", stage: 1, status: "PENDING" });
      const stage2 = mockApproval({ id: "appr-2", stage: 2, status: "PENDING", approverId: "fin-user" });
      const quotation = mockQuotation({ status: "PENDING_APPROVAL" });

      expect(() =>
        service.validateApprovalAction({
          approval: stage2,
          approverId: "fin-user",
          action: "APPROVE",
          quotation,
          existingApprovals: [stage1, stage2],
        }),
      ).toThrow(SkippedStageError);
    });

    it("throws DuplicateApprovalError if another approval for the same stage is already APPROVED", () => {
      const stage1A = mockApproval({ id: "appr-1", stage: 1, status: "APPROVED" });
      const stage1B = mockApproval({ id: "appr-1b", stage: 1, status: "PENDING", approverId: "mgr-user" });
      const quotation = mockQuotation({ status: "PENDING_APPROVAL" });

      expect(() =>
        service.validateApprovalAction({
          approval: stage1B,
          approverId: "mgr-user",
          action: "APPROVE",
          quotation,
          existingApprovals: [stage1A, stage1B],
        }),
      ).toThrow(DuplicateApprovalError);
    });

    it("passes validation for valid sequential approval", () => {
      const stage1 = mockApproval({ id: "appr-1", stage: 1, status: "APPROVED" });
      const stage2 = mockApproval({ id: "appr-2", stage: 2, status: "PENDING", approverId: "fin-user" });
      const quotation = mockQuotation({ status: "PENDING_APPROVAL" });

      expect(() =>
        service.validateApprovalAction({
          approval: stage2,
          approverId: "fin-user",
          action: "APPROVE",
          quotation,
          existingApprovals: [stage1, stage2],
        }),
      ).not.toThrow();
    });
  });
});
