import { describe, it, expect, beforeEach } from "vitest";
import { StateHistoryService } from "../services/StateHistoryService.js";
import { QuotationState } from "../types/types.js";
import { createMockPrisma } from "./helpers.js";

describe("StateHistoryService", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let historyService: StateHistoryService;

  beforeEach(() => {
    prisma = createMockPrisma();
    historyService = new StateHistoryService(prisma);
  });

  it("records immutable state transitions in AuditLog", async () => {
    const entry = await historyService.recordTransition({
      quotationId: "quot-1",
      previousState: QuotationState.Draft,
      nextState: QuotationState.Submitted,
      actorId: "user-rep-1",
      reason: "Submitted by sales rep",
      timestamp: new Date("2026-03-01T10:00:00Z"),
    });

    expect(entry.id).toBeDefined();
    expect(entry.previousState).toBe(QuotationState.Draft);
    expect(entry.nextState).toBe(QuotationState.Submitted);
    expect(entry.actorId).toBe("user-rep-1");
    expect(entry.reason).toBe("Submitted by sales rep");

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entity: "QuotationState",
          entityId: "quot-1",
          userId: "user-rep-1",
        }),
      }),
    );
  });

  it("retrieves full chronological transition history for quotation", async () => {
    // Record step 1: Draft -> Submitted
    await historyService.recordTransition({
      quotationId: "quot-1",
      previousState: QuotationState.Draft,
      nextState: QuotationState.Submitted,
      actorId: "user-rep-1",
      reason: "Submitted for approval",
      timestamp: new Date("2026-03-01T10:00:00Z"),
    });

    // Record step 2: Submitted -> PendingManager
    await historyService.recordTransition({
      quotationId: "quot-1",
      previousState: QuotationState.Submitted,
      nextState: QuotationState.PendingManager,
      actorId: "system",
      reason: "Routed to Manager",
      timestamp: new Date("2026-03-01T10:01:00Z"),
    });

    // Record step 3: PendingManager -> Approved
    await historyService.recordTransition({
      quotationId: "quot-1",
      previousState: QuotationState.PendingManager,
      nextState: QuotationState.Approved,
      actorId: "user-mgr-1",
      reason: "Discount approved by sales manager",
      timestamp: new Date("2026-03-01T10:30:00Z"),
    });

    const timeline = await historyService.getHistory("quot-1");

    expect(timeline).toHaveLength(3);
    expect(timeline[0].previousState).toBe(QuotationState.Draft);
    expect(timeline[0].nextState).toBe(QuotationState.Submitted);
    expect(timeline[0].actorId).toBe("user-rep-1");

    expect(timeline[1].previousState).toBe(QuotationState.Submitted);
    expect(timeline[1].nextState).toBe(QuotationState.PendingManager);

    expect(timeline[2].previousState).toBe(QuotationState.PendingManager);
    expect(timeline[2].nextState).toBe(QuotationState.Approved);
    expect(timeline[2].reason).toBe("Discount approved by sales manager");
  });
});
