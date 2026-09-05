"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { RecommendationCard, CounterfactualRec } from "../../components/RecommendationCard";

interface CounterfactualSectionProps {
  recommendations: CounterfactualRec[];
  onApplyRecommendation?: (rec: CounterfactualRec) => void;
}

export const CounterfactualSection: React.FC<CounterfactualSectionProps> = ({
  recommendations,
  onApplyRecommendation,
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-secondary" />
          <h3 className="font-title-md text-sm font-bold text-on-surface">
            Counterfactual Engine Recommendations ({recommendations.length})
          </h3>
        </div>
        <span className="text-[11px] text-outline font-medium">
          Optimized alternative scenarios to achieve automatic fast-track approval
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            onApply={onApplyRecommendation}
          />
        ))}
      </div>
    </div>
  );
};
