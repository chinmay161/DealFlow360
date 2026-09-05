"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sliders,
  Sparkles,
} from "lucide-react";

export interface DecisionTraceRule {
  ruleId: string;
  ruleName: string;
  outcome: "PASS" | "WARN" | "FAIL";
  severity: string;
  computedValue: any;
  threshold: any;
  explanation: string;
  evaluatedAt: string;
  inputs: Record<string, any>;
  recommendation?: string | null;
}

interface DecisionTraceSectionProps {
  entries: DecisionTraceRule[];
}

export const DecisionTraceSection: React.FC<DecisionTraceSectionProps> = ({ entries }) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(
    entries.filter((e) => e.outcome !== "PASS").map((e) => e.ruleId)
  );

  const toggleExpand = (ruleId: string) => {
    setExpandedIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const getOutcomeBadge = (outcome: "PASS" | "WARN" | "FAIL") => {
    switch (outcome) {
      case "PASS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Pass</span>
          </span>
        );
      case "WARN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Warn</span>
          </span>
        );
      case "FAIL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" />
            <span>Fail</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h3 className="font-title-md text-sm font-bold text-on-surface">
            Interactive Decision Trace ({entries.length} Evaluated Rules)
          </h3>
        </div>
        <span className="text-[11px] text-outline font-medium">Click to expand inputs & computed values</span>
      </div>

      <div className="divide-y divide-[#E5E7EB]">
        {entries.map((rule) => {
          const isExpanded = expandedIds.includes(rule.ruleId);

          return (
            <div key={rule.ruleId} className="transition-colors">
              {/* Rule Summary Header Row */}
              <div
                onClick={() => toggleExpand(rule.ruleId)}
                className="px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0">{getOutcomeBadge(rule.outcome)}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-on-surface truncate">
                      {rule.ruleName}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate mt-0.5">
                      {rule.explanation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block text-[11px]">
                    <span className="text-slate-400">Value: </span>
                    <strong className="text-on-surface font-semibold tnum">
                      {typeof rule.computedValue === "number"
                        ? rule.computedValue.toFixed(1)
                        : String(rule.computedValue)}
                    </strong>
                    <span className="text-slate-400"> | Limit: </span>
                    <strong className="text-on-surface font-semibold tnum">
                      {String(rule.threshold)}
                    </strong>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expandable Details Drawer */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {/* Computed Value Card */}
                    <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Computed Value
                      </span>
                      <p className="text-sm font-bold text-on-surface tnum">
                        {typeof rule.computedValue === "number"
                          ? rule.computedValue.toFixed(1)
                          : String(rule.computedValue)}
                      </p>
                    </div>

                    {/* Authorized Threshold Card */}
                    <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Threshold Standard
                      </span>
                      <p className="text-sm font-bold text-on-surface tnum">
                        {String(rule.threshold)}
                      </p>
                    </div>

                    {/* Rule Severity */}
                    <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Severity Level
                      </span>
                      <p className="text-sm font-bold text-primary">{rule.severity}</p>
                    </div>
                  </div>

                  {/* Input Parameters JSON / Key-Values */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Rule Input Parameters:
                    </span>
                    <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto">
                      <pre>{JSON.stringify(rule.inputs, null, 2)}</pre>
                    </div>
                  </div>

                  {/* Recommendation if Failed / Warned */}
                  {rule.recommendation && (
                    <div className="p-2.5 bg-amber-50 rounded border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                      <Sparkles className="h-3.5 w-3.5 text-amber-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Remediation: </strong>
                        <span>{rule.recommendation}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
