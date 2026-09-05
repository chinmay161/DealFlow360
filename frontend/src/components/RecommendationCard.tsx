"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowDown, Check } from "lucide-react";
import type { CounterfactualRecommendation } from "@/types/counterfactual.types";

interface RecommendationCardProps {
  recommendation: CounterfactualRecommendation;
  onApplyPreview: (recommendation: CounterfactualRecommendation) => void;
  isApplied?: boolean;
}

export function RecommendationCard({
  recommendation,
  onApplyPreview,
  isApplied = false,
}: RecommendationCardProps) {
  const [justApplied, setJustApplied] = useState(false);

  const handleApply = () => {
    setJustApplied(true);
    onApplyPreview(recommendation);
    setTimeout(() => setJustApplied(false), 2000);
  };

  return (
    <Card className="rounded-xl p-5 border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-white shadow-sm hover:shadow-md transition-all dark:border-indigo-950 dark:from-indigo-950/20 dark:to-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {recommendation.title}
            </h4>
            <p className="text-xs text-slate-500">{recommendation.description}</p>
          </div>
        </div>

        <Badge variant="success" className="font-semibold text-xs whitespace-nowrap">
          {recommendation.expectedResult}
        </Badge>
      </div>

      {/* Suggested modifications */}
      <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
        {recommendation.changes.map((change, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="text-[11px] text-slate-500 truncate">{change.productName}</div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <span className="line-through text-rose-500">{change.currentValue}%</span>
              <ArrowDown className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-600">{change.proposedValue}%</span>
            </div>
          </div>
        ))}

        <div className="space-y-0.5">
          <div className="text-[11px] text-slate-500">Revenue Impact</div>
          <div className="font-semibold font-mono text-slate-900 dark:text-slate-100">
            {recommendation.revenueImpactFormatted}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[11px] text-slate-500">Projected Risk</div>
          <div className="font-semibold text-emerald-600 flex items-center gap-1">
            <span>{recommendation.projectedRiskScore}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (from {recommendation.currentRiskScore})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400">
          Preview only • Does not submit automatically
        </span>

        <Button
          type="button"
          size="sm"
          variant={isApplied || justApplied ? "secondary" : "outline"}
          onClick={handleApply}
          className="text-xs font-semibold h-8"
        >
          {isApplied || justApplied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
              Applied to Preview
            </>
          ) : (
            "Apply Recommendation"
          )}
        </Button>
      </div>
    </Card>
  );
}
