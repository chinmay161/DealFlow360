"use client";

import React from "react";

interface PipelineStage {
  stage: string;
  value: number;
  displayValue: string;
  count: number;
}

const defaultStages: PipelineStage[] = [
  { stage: "Qualification", value: 0, displayValue: "₹0", count: 0 },
  { stage: "Proposal", value: 0, displayValue: "₹0", count: 0 },
  { stage: "Negotiation", value: 0, displayValue: "₹0", count: 0 },
  { stage: "Approval", value: 0, displayValue: "₹0", count: 0 },
  { stage: "Closed Won", value: 0, displayValue: "₹0", count: 0 },
];

interface PipelinePerformanceProps {
  initialStages?: PipelineStage[];
  maxValue?: number;
}

export const PipelinePerformance: React.FC<PipelinePerformanceProps> = ({
  initialStages,
  maxValue,
}) => {
  const stageData = initialStages && initialStages.length > 0 ? initialStages : defaultStages;
  const maxVal = maxValue || Math.max(...stageData.map((s) => s.value), 100);
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base" data-icon="bar_chart">
              bar_chart
            </span>
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">
              Pipeline Performance
            </h2>
          </div>
          <p className="font-body-sm text-[11px] text-outline mt-0.5">
            Deal value by sales stage.
          </p>
        </div>
        <div className="flex items-center gap-3 text-label-sm text-outline">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
            <span>Active Pipeline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]"></span>
            <span>Closed Won</span>
          </div>
        </div>
      </div>

      {/* Horizontal Minimalist Bars */}
      <div className="space-y-3.5">
        {stageData.map((s) => {
          const percentage = Math.min(100, Math.round((s.value / maxVal) * 100));
          const isWon = s.stage === "Closed Won";

          return (
            <div key={s.stage} className="flex items-center gap-4 group">
              {/* Stage Name */}
              <div className="w-28 shrink-0 flex items-baseline justify-between">
                <span className="font-label-md text-body-sm font-medium text-on-surface">
                  {s.stage}
                </span>
                <span className="font-body-sm text-[11px] text-outline">
                  {s.count} deals
                </span>
              </div>

              {/* Progress Track & Bar */}
              <div className="flex-1 h-5 bg-[#F1F5F9] rounded overflow-hidden flex relative">
                <div
                  className={`h-full transition-all duration-300 rounded ${
                    isWon ? "bg-[#10B981]" : "bg-primary hover:bg-[#1E3A8A]"
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Value */}
              <div className="w-20 shrink-0 text-right">
                <span className="font-code-tabular text-body-md font-bold text-on-surface tnum">
                  {s.displayValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Scale Line */}
      <div className="mt-4 pt-2 border-t border-[#F1F5F9] flex justify-between pl-32 pr-20 text-[10px] font-label-sm text-outline">
        <span>₹0</span>
        <span>₹10L</span>
        <span>₹20L</span>
        <span>₹30L</span>
        <span>₹42L Max</span>
      </div>
    </div>
  );
};
