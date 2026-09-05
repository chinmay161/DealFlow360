"use client";

import React, { useState } from "react";
import { Sparkles, Eye, Check } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export interface CounterfactualRec {
  id: string;
  title: string;
  description: string;
  changes: {
    lineItemId?: string;
    productName?: string;
    field: string;
    currentValue: any;
    proposedValue: any;
    displayChange: string;
  }[];
  expectedResult: string;
  revenueImpact: number;
  revenueImpactFormatted: string;
  projectedRiskScore: number;
  currentRiskScore: number;
  feasibilityScore: number;
}

interface RecommendationCardProps {
  rec: CounterfactualRec;
  onApply?: (rec: CounterfactualRec) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ rec, onApply }) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [applied, setApplied] = useState(false);
  const { success } = useToast();

  const handleApply = () => {
    setApplied(true);
    success("Recommendation Applied", `${rec.title} adjustments simulated on quotation.`);
    if (onApply) onApply(rec);
  };

  return (
    <>
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between space-y-3">
        {/* Header with Feasibility */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-4 w-4 text-secondary flex-shrink-0" />
            <span className="truncate">{rec.title}</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
            {rec.feasibilityScore}% Feasible
          </span>
        </div>

        <p className="text-xs text-outline leading-relaxed">{rec.description}</p>

        {/* Change Banner: e.g. 18% ↓ 12% */}
        <div className="p-3 bg-surface-container-low rounded-lg border border-[#D1D5DB]/60 flex items-center justify-around text-center">
          {rec.changes.map((ch, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-[10px] text-outline font-medium uppercase">
                {ch.productName || "Concession"}
              </span>
              <div className="flex items-center gap-2 justify-center font-bold text-sm text-on-surface">
                <span className="text-slate-500 line-through">{ch.currentValue}%</span>
                <span className="text-xs text-secondary font-extrabold">↓</span>
                <span className="text-primary font-bold">{ch.proposedValue}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Key Metrics Grid: Expected Result, Revenue Impact, Risk Score */}
        <div className="grid grid-cols-3 gap-2 py-1 text-center">
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Expected Result</span>
            <span className="text-xs font-bold text-emerald-700 block mt-0.5">
              {rec.expectedResult}
            </span>
          </div>

          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Revenue Impact</span>
            <span className="text-xs font-bold text-on-surface block mt-0.5 tnum">
              {rec.revenueImpactFormatted}
            </span>
          </div>

          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Risk Score</span>
            <span className="text-xs font-bold text-primary block mt-0.5 tnum">
              {rec.currentRiskScore} → {rec.projectedRiskScore}
            </span>
          </div>
        </div>

        {/* Buttons: Preview & Apply */}
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition-colors flex items-center gap-1"
          >
            <Eye className="h-3 w-3 text-slate-500" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={applied}
            className={`px-3 py-1 text-xs font-semibold rounded shadow-sm transition-colors flex items-center gap-1 ${
              applied
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-primary hover:bg-[#1E3A8A] text-on-primary"
            }`}
          >
            {applied ? (
              <>
                <Check className="h-3 w-3" />
                <span>Applied</span>
              </>
            ) : (
              <span>Apply Recommendation</span>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-[#D1D5DB] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                <h3 className="text-base font-bold text-on-surface">Simulation Preview</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-outline">{rec.description}</p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Proposed Strategy:</span>
                <span className="font-semibold text-on-surface">{rec.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Expected Approval Status:</span>
                <span className="font-bold text-emerald-700">{rec.expectedResult}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Net Financial Impact:</span>
                <span className="font-bold text-on-surface tnum">{rec.revenueImpactFormatted}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Composite Risk Trajectory:</span>
                <span className="font-bold text-primary tnum">
                  {rec.currentRiskScore}/100 ↓ {rec.projectedRiskScore}/100
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  handleApply();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-[#1E3A8A] text-on-primary shadow-sm"
              >
                Apply Recommendation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
