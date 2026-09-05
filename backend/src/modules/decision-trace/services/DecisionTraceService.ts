/**
 * DecisionTraceService
 *
 * Primary orchestrator for the Decision Trace module.
 *
 * Responsibilities:
 *   1. Load all RuleEvaluation rows for a quotation
 *   2. Sort by execution order (evaluatedAt ASC)
 *   3. Build a complete explanation via TraceBuilder
 *   4. Optionally format via TraceFormatter
 *   5. Return structured JSON
 *
 * Public API:
 *   const trace = await decisionTraceService.getDecisionTrace(quotationId);
 */

import type { PrismaClient } from "@prisma/client";
import { createModuleLogger } from "../../../lib/logger.js";
import type { RuleEvaluationRecord } from "../types/types.js";
import type { TraceFormat, ExportFormat } from "../types/types.js";
import type {
  DecisionTraceResponse,
  DecisionTraceRuleEntry,
  EmptyTraceResponse,
  TraceFilterParams,
  TraceSearchParams,
} from "../interfaces/interfaces.js";
import {
  buildRuleEntries,
  buildOverallDecision,
  buildOverallRiskScore,
  buildApprovalLevel,
  buildSummary,
  buildDecisionTree,
  buildTimeline,
  buildStatistics,
  filterEntries,
} from "./TraceBuilder.js";
import { formatTrace } from "./TraceFormatter.js";

const log = createModuleLogger("decision-trace");

// ─── Error types ─────────────────────────────────────────────────────────────

export class QuotationNotFoundError extends Error {
  constructor(quotationId: string) {
    super(`Quotation not found: ${quotationId}`);
    this.name = "QuotationNotFoundError";
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class DecisionTraceService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieve the full decision trace for a quotation.
   *
   * @param quotationId  UUID of the quotation.
   * @param options      Optional filter and format parameters.
   * @returns            Structured trace response or empty-trace message.
   */
  async getDecisionTrace(
    quotationId: string,
    options: TraceFilterParams = {},
  ): Promise<DecisionTraceResponse | EmptyTraceResponse> {
    const traceStart = performance.now();

    log.info({ quotationId }, "Generating decision trace");

    // 1. Verify quotation exists
    const dbStart = performance.now();
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      select: { id: true, currency: true },
    });
    const quotationQueryMs = performance.now() - dbStart;

    if (!quotation) {
      log.warn({ quotationId, queryMs: Math.round(quotationQueryMs) }, "Quotation not found");
      throw new QuotationNotFoundError(quotationId);
    }

    // 2. Load all RuleEvaluation rows
    const evalStart = performance.now();
    const rawEvaluations = await this.prisma.ruleEvaluation.findMany({
      where: { quotationId },
      orderBy: { createdAt: "asc" },
    });
    const evalQueryMs = performance.now() - evalStart;

    log.debug(
      { quotationId, count: rawEvaluations.length, queryMs: Math.round(evalQueryMs) },
      "RuleEvaluations loaded",
    );

    // 3. No evaluations → early return
    if (rawEvaluations.length === 0) {
      log.info({ quotationId }, "No decision trace available");
      return { message: "No decision trace available." };
    }

    // 4. Normalise Prisma records
    const evaluations: RuleEvaluationRecord[] = rawEvaluations.map((ev: any) => {
      const meta = (ev.metadata as Record<string, any>) || {};
      const inputs = ev.inputs ?? meta.inputs ?? meta.metadata ?? meta;
      const ruleId = ev.ruleId ?? inputs?.ruleId ?? meta?.ruleId ?? null;
      const computedValue = ev.computedValue !== undefined && ev.computedValue !== null
        ? Number(ev.computedValue)
        : Number(inputs?.computedValue ?? meta.computedValue ?? 0);
      const threshold = ev.threshold !== undefined && ev.threshold !== null
        ? Number(ev.threshold)
        : Number(inputs?.threshold ?? meta.threshold ?? 0);
      const explanation = ev.explanation ?? ev.message ?? "";

      return {
        id: ev.id,
        ruleName: ev.ruleName,
        inputs: typeof inputs === "object" ? { ruleId, ...inputs } : { ruleId },
        computedValue,
        threshold,
        outcome: (ev.outcome ?? "PASS") as RuleEvaluationRecord["outcome"],
        explanation,
        evaluatedAt: ev.evaluatedAt ?? ev.createdAt ?? new Date(),
        createdAt: ev.createdAt ?? new Date(),
        quotationId: ev.quotationId,
        ruleId,
      };
    });

    // 5. Build trace
    const totalDbMs = quotationQueryMs + evalQueryMs;
    let entries = buildRuleEntries(evaluations);
    const approvalLevel = buildApprovalLevel(evaluations);

    // 6. Apply filters
    if (options.passed !== undefined || options.failed !== undefined || options.severity || options.rule) {
      entries = filterEntries(entries, options);
    }

    // 7. Assemble response
    const allEntries = buildRuleEntries(evaluations); // unfiltered for stats / tree / timeline
    let response: DecisionTraceResponse = {
      quotationId,
      overallDecision: buildOverallDecision(allEntries),
      overallRiskScore: buildOverallRiskScore(allEntries),
      approvalLevel,
      summary: buildSummary(allEntries, approvalLevel),
      rules: entries,
      decisionTree: buildDecisionTree(allEntries),
      timeline: buildTimeline(allEntries),
      statistics: buildStatistics(allEntries, totalDbMs),
    };

    // 8. Optionally format for human readability
    if (options.format === "human") {
      response = formatTrace(response, quotation.currency);
    }

    const totalMs = performance.now() - traceStart;
    log.info(
      {
        quotationId,
        rulesEvaluated: allEntries.length,
        filtered: entries.length,
        totalMs: Math.round(totalMs),
        dbMs: Math.round(totalDbMs),
      },
      "Decision trace generated",
    );

    return response;
  }

  // ─── Search ──────────────────────────────────────────────────────────

  /**
   * Search rule evaluations across all quotations.
   */
  async searchTraces(
    params: TraceSearchParams,
  ): Promise<DecisionTraceRuleEntry[]> {
    const where: Record<string, unknown> = {};

    if (params.quotationId) {
      where.quotationId = params.quotationId;
    }
    if (params.outcome) {
      where.outcome = params.outcome;
    }
    if (params.ruleName) {
      where.ruleName = { contains: params.ruleName, mode: "insensitive" };
    }
    if (params.ruleId) {
      where.ruleId = params.ruleId;
    }
    if (params.date) {
      const start = new Date(params.date);
      const end = new Date(params.date);
      end.setDate(end.getDate() + 1);
      where.evaluatedAt = { gte: start, lt: end };
    }

    const rawResults = await this.prisma.ruleEvaluation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100, // cap results to prevent unbounded queries
    });

    const records: RuleEvaluationRecord[] = rawResults.map((ev) => {
      const meta = (ev.metadata as Record<string, any>) || {};
      return {
        id: ev.id,
        ruleName: ev.ruleName,
        inputs: meta.metadata ?? meta,
        computedValue: Number(meta.computedValue ?? 0),
        threshold: Number(meta.threshold ?? 0),
        outcome: ev.outcome as RuleEvaluationRecord["outcome"],
        explanation: ev.message ?? "",
        evaluatedAt: ev.createdAt,
        createdAt: ev.createdAt,
        quotationId: ev.quotationId,
        ruleId: ev.ruleId,
      };
    });

    return buildRuleEntries(records);
  }

  // ─── Export ──────────────────────────────────────────────────────────

  /**
   * Export the decision trace in JSON or CSV format.
   */
  async exportTrace(
    quotationId: string,
    format: ExportFormat = "json",
  ): Promise<string> {
    const trace = await this.getDecisionTrace(quotationId);

    // If empty trace
    if ("message" in trace) {
      return format === "csv"
        ? "message\nNo decision trace available."
        : JSON.stringify(trace, null, 2);
    }

    if (format === "csv") {
      return this.toCsv(trace.rules);
    }

    return JSON.stringify(trace, null, 2);
  }

  // ─── Private helpers ─────────────────────────────────────────────────

  private toCsv(entries: DecisionTraceRuleEntry[]): string {
    const headers = [
      "ruleId",
      "ruleName",
      "status",
      "severity",
      "computedValue",
      "threshold",
      "outcome",
      "explanation",
      "evaluatedAt",
      "inputs",
    ];

    const rows = entries.map((e) =>
      [
        this.escapeCsv(String(e.ruleId)),
        this.escapeCsv(e.ruleName),
        e.status,
        e.severity,
        String(e.computedValue),
        String(e.threshold),
        e.outcome,
        this.escapeCsv(e.explanation ?? ""),
        e.evaluatedAt,
        this.escapeCsv(JSON.stringify(e.inputs)),
      ].join(","),
    );

    return [headers.join(","), ...rows].join("\n");
  }

  private escapeCsv(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
