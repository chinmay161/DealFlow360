import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RuleCard } from "@/components/RuleCard";
import { GitBranch } from "lucide-react";
import type { DecisionTraceRuleEntry } from "@/types/decision-trace.types";

interface DecisionTraceTimelineProps {
  entries: DecisionTraceRuleEntry[];
  isLoading?: boolean;
}

export function DecisionTraceTimeline({
  entries = [],
  isLoading = false,
}: DecisionTraceTimelineProps) {
  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-semibold">Decision Trace Evaluation Chain</CardTitle>
          </div>
          <CardDescription className="mt-0.5">
            Expand individual governance rules to inspect input parameters, numerical thresholds, and computed outcomes.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Loading evaluation traces...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No decision traces recorded for this quotation.
          </div>
        ) : (
          entries.map((rule) => <RuleCard key={rule.ruleId} rule={rule} />)
        )}
      </CardContent>
    </Card>
  );
}
