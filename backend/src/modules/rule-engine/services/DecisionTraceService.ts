/**
 * DecisionTraceService
 *
 * Read-side service that retrieves and formats persisted RuleEvaluation
 * records for a quotation. Used by the API layer to render the
 * Decision Trace panel.
 */

import type { PrismaClient } from "@prisma/client";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("decision-trace-service");

export interface DecisionTraceEntry {
  id: string;
  ruleName: string;
  outcome: string;
  computedValue: number;
  threshold: number;
  explanation: string | null;
  inputs: unknown;
  evaluatedAt: Date;
  ruleId: string | null;
}

export interface DecisionTrace {
  quotationId: string;
  entries: DecisionTraceEntry[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warned: number;
    skipped: number;
  };
}

export class DecisionTraceService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieve the full decision trace for a quotation.
   *
   * @param quotationId UUID of the quotation.
   * @returns Structured trace with summary counts.
   */
  async getTrace(quotationId: string): Promise<DecisionTrace> {
    const evaluations = await this.prisma.ruleEvaluation.findMany({
      where: { quotationId },
      orderBy: { createdAt: "asc" },
    });

    const entries: DecisionTraceEntry[] = evaluations.map((e) => {
      const meta = (e.metadata as Record<string, any>) || {};
      return {
        id: e.id,
        ruleName: e.ruleName,
        outcome: e.outcome,
        computedValue: Number(meta.computedValue ?? 0),
        threshold: Number(meta.threshold ?? 0),
        explanation: e.message,
        inputs: meta.metadata ?? meta,
        evaluatedAt: e.createdAt,
        ruleId: e.ruleId,
      };
    });

    const summary = {
      total: entries.length,
      passed: entries.filter((e) => e.outcome === "PASS").length,
      failed: entries.filter((e) => e.outcome === "FAIL").length,
      warned: entries.filter((e) => e.outcome === "WARN").length,
      skipped: entries.filter((e) => e.outcome === "SKIP").length,
    };

    log.debug({ quotationId, total: summary.total }, "Decision trace retrieved");

    return { quotationId, entries, summary };
  }
}
