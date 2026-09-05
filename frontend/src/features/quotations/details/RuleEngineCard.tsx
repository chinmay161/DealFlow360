import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import type { DecisionTraceSummary } from "@/types/decision-trace.types";

interface RuleEngineCardProps {
  summary?: DecisionTraceSummary;
  isLoading?: boolean;
}

export function RuleEngineCard({ summary, isLoading = false }: RuleEngineCardProps) {
  if (isLoading || !summary) {
    return (
      <Card className="p-6 rounded-xl border border-slate-200/80 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="h-10 w-full bg-slate-100 rounded" />
      </Card>
    );
  }

  const isAuto = summary.approvalLevel === "AUTO";
  const isFinance = summary.approvalLevel === "FINANCE" || summary.approvalLevel === "VP";

  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60 overflow-hidden">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm font-semibold">Rule Engine Autonomous Evaluation</CardTitle>
        </div>

        <Badge
          variant={isAuto ? "success" : isFinance ? "warning" : "info"}
          className="text-xs font-semibold px-2.5 py-0.5"
        >
          {summary.approvalLevel} APPROVAL MANDATE
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-xs">
        {/* Metric Pills Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Overall Decision */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium block">Overall Decision</span>
            <span className="font-bold text-sm text-slate-900 mt-1 block">
              {summary.overallDecision.replace(/_/g, " ")}
            </span>
          </div>

          {/* Risk Score */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium block">Composite Deal Risk</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`font-mono text-base font-extrabold ${
                  summary.riskScore <= 30
                    ? "text-emerald-600"
                    : summary.riskScore <= 70
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {summary.riskScore}
              </span>
              <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
          </div>

          {/* Rules Passed */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-emerald-900">
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Rules Passed
            </span>
            <span className="font-mono text-base font-bold text-emerald-800 mt-1 block">
              {summary.passedCount} / {summary.totalRules}
            </span>
          </div>

          {/* Rules Failed or Warnings */}
          <div
            className={`p-3 rounded-xl border ${
              summary.failedCount > 0
                ? "bg-rose-50/60 border-rose-200/60 text-rose-900"
                : "bg-amber-50/60 border-amber-200/60 text-amber-900"
            }`}
          >
            <span className="text-[11px] font-medium flex items-center gap-1">
              {summary.failedCount > 0 ? (
                <XCircle className="h-3 w-3 text-rose-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-600" />
              )}
              Exceptions / Warnings
            </span>
            <span className="font-mono text-base font-bold mt-1 block">
              {summary.failedCount + summary.warningCount} rules
            </span>
          </div>
        </div>

        {/* Recommendations block if any */}
        {summary.recommendations && summary.recommendations.length > 0 && (
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900 text-xs">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span>Rule Engine Prescriptions:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 text-xs">
              {summary.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
