"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/components/ui/card";
import type { DecisionTraceRuleEntry } from "@/types/decision-trace.types";

interface RuleCardProps {
  rule: DecisionTraceRuleEntry;
}

export function RuleCard({ rule }: RuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPass = rule.outcome === "PASS";
  const isWarn = rule.outcome === "WARN";

  const borderColor = isPass
    ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20"
    : isWarn
    ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/20"
    : "border-rose-200 dark:border-rose-900/60 bg-rose-50/20";

  return (
    <Card className={cn("rounded-xl transition-all border", borderColor)}>
      <div
        className="p-4 flex items-start justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isPass ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : isWarn ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {rule.ruleName}
              </h4>
              <Badge
                variant={isPass ? "success" : isWarn ? "warning" : "destructive"}
                className="text-[10px] px-1.5 py-0 uppercase"
              >
                {rule.outcome}
              </Badge>
              <span className="text-xs text-slate-400">Severity: {rule.severity}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {rule.explanation}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-xs space-y-3 bg-white/50 dark:bg-slate-950/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-900">
              <div className="text-[11px] text-slate-500">Threshold</div>
              <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {typeof rule.threshold === "number" ? rule.threshold.toLocaleString() : rule.threshold}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-900">
              <div className="text-[11px] text-slate-500">Computed Value</div>
              <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {typeof rule.computedValue === "number" ? rule.computedValue.toLocaleString() : rule.computedValue}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-900">
              <div className="text-[11px] text-slate-500">Rule ID</div>
              <div className="font-mono text-slate-800 dark:text-slate-200 truncate">
                {rule.ruleId}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-900">
              <div className="text-[11px] text-slate-500">Evaluated</div>
              <div className="text-slate-800 dark:text-slate-200">
                {new Date(rule.evaluatedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {rule.inputs && Object.keys(rule.inputs).length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">Inputs & Parameters:</div>
              <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[11px] overflow-x-auto font-mono">
                {JSON.stringify(rule.inputs, null, 2)}
              </pre>
            </div>
          )}

          {rule.recommendation && (
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
              💡 Recommendation: {rule.recommendation}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
