"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

interface DecisionCardProps {
  overallDecision: string;
  approvalLevel: string;
  riskScore: number;
  rulesPassed: number;
  rulesFailed: number;
  rulesWarning: number;
  recommendations?: string[];
  className?: string;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  overallDecision,
  approvalLevel,
  riskScore,
  rulesPassed,
  rulesFailed,
  rulesWarning,
  recommendations = [],
  className = "",
}) => {
  const isAutoApprove = overallDecision === "AUTO_APPROVE" || overallDecision === "APPROVED";
  const isRejected = overallDecision === "REJECTED";

  const totalRules = rulesPassed + rulesFailed + rulesWarning;
  const passRate = totalRules > 0 ? Math.round((rulesPassed / totalRules) * 100) : 100;

  return (
    <div className={`bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm space-y-4 ${className}`}>
      {/* Header with Decision Pill */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider">
            Rule Engine Decision
          </span>
          <h3 className="text-base font-bold text-on-surface mt-0.5">
            {isAutoApprove
              ? "Fast-Track Auto Approved"
              : isRejected
              ? "Automated Policy Rejection"
              : "Manager Review Mandated"}
          </h3>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isAutoApprove
              ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
              : isRejected
              ? "bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]"
              : "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]"
          }`}
        >
          {isAutoApprove ? (
            <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          ) : isRejected ? (
            <XCircle className="h-4 w-4 text-[#E11D48]" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-[#D97706]" />
          )}
          <span>{overallDecision}</span>
        </div>
      </div>

      {/* Grid: Approval Level, Risk Score, Rules Compliance */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {/* Mandated Level */}
        <div className="p-3 rounded-lg bg-surface-container-low border border-[#D1D5DB]/60">
          <span className="text-[11px] text-outline font-medium">Mandated Level</span>
          <p className="text-sm font-bold text-primary mt-1">Level 1 ({approvalLevel})</p>
          <span className="text-[11px] text-slate-500">Commercial Authority</span>
        </div>

        {/* Risk Score */}
        <div className="p-3 rounded-lg bg-surface-container-low border border-[#D1D5DB]/60">
          <span className="text-[11px] text-outline font-medium">Composite Risk</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-lg font-extrabold tnum ${
                riskScore >= 70
                  ? "text-[#E11D48]"
                  : riskScore >= 40
                  ? "text-[#D97706]"
                  : "text-[#059669]"
              }`}
            >
              {riskScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {riskScore >= 70 ? "High Exposure" : riskScore >= 40 ? "Moderate Margin" : "Low Risk"}
          </span>
        </div>

        {/* Rule Outcomes */}
        <div className="p-3 rounded-lg bg-surface-container-low border border-[#D1D5DB]/60">
          <span className="text-[11px] text-outline font-medium">Rule Compliance</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              {rulesPassed} Pass
            </span>
            {rulesWarning > 0 && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                {rulesWarning} Warn
              </span>
            )}
            {rulesFailed > 0 && (
              <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                {rulesFailed} Fail
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{passRate}% rule pass rate</span>
        </div>
      </div>

      {/* Recommendations highlight if present */}
      {recommendations.length > 0 && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1.5">
            <Info className="h-3.5 w-3.5 text-amber-700" />
            <span>Policy Guidance & Recommendations</span>
          </div>
          <ul className="space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-amber-950 flex items-start gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0"></span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
