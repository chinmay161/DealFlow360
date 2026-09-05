"use client";

import React from "react";
import { SerializedQuoteLineItem, SerializedApproval } from "@/lib/quotations";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

interface DealIntelligenceRowProps {
  currency?: string;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  totalValue?: number;
  estimatedMargin?: number;
  riskScore?: number | null;
  lineItems?: SerializedQuoteLineItem[];
  approvals?: SerializedApproval[];
}

export const DealIntelligenceRow: React.FC<DealIntelligenceRowProps> = ({
  currency = "INR",
  subtotal = 2025000,
  discountTotal = 342000,
  taxTotal = 147000,
  totalValue = 1830000,
  estimatedMargin = 36,
  riskScore = 72,
  lineItems = [],
  approvals = [],
}) => {
  const currentRisk = riskScore ?? 0;
  const isHighRisk = currentRisk >= 70;
  const isMediumRisk = currentRisk >= 40 && currentRisk < 70;

  const blendedDiscountPercent = subtotal > 0 ? (discountTotal / subtotal) * 100 : 0;
  const grossMarginAmount = totalValue * (estimatedMargin / 100);
  const totalUnits = lineItems.reduce((acc, item) => acc + item.quantity, 0);

  // Derive workflow steps from database approval relation
  const activeApproval = approvals[0];
  const workflowSteps = activeApproval?.workflowSteps || [];

  // Identify anomalies in line items
  const anomalyItems = lineItems.filter(
    (li) =>
      (li.governanceStatus && li.governanceStatus.toLowerCase().includes("over")) ||
      (li.discountLimitPercent !== null && li.discountPercent > li.discountLimitPercent)
  );

  return (
    <div className="grid grid-cols-3 gap-space-base pt-space-xs items-stretch">
      {/* COLUMN 1: Financial Summary */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" data-icon="payments">
                payments
              </span>
              <span className="font-title-md text-title-md font-semibold text-on-surface">
                Financial Summary
              </span>
            </div>
            <span className="text-[11px] font-label-sm text-outline">{currency} ({getCurrencySymbol(currency)})</span>
          </div>

          <div className="space-y-2.5 font-body-sm text-body-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Subtotal List Value</span>
              <span className="font-code-tabular tnum text-on-surface font-medium">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span>Blended Discount</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                  {blendedDiscountPercent.toFixed(1)}%
                </span>
              </span>
              <span className="font-code-tabular tnum text-[#9F1239] font-medium">
                -{formatCurrency(discountTotal, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Estimated GST (18%)</span>
              <span className="font-code-tabular tnum text-on-surface font-medium">
                {formatCurrency(taxTotal, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-[#E5E7EB] space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
                Net Total Value
              </span>
              <span className="font-metric-display text-metric-display font-bold text-primary tnum leading-tight">
                {formatCurrency(totalValue, currency)}
              </span>
            </div>
            <div className="text-right">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
                Est. Margin
              </span>
              <span className="font-title-md text-title-md font-bold text-[#065F46] tnum">
                {formatCurrency(grossMarginAmount, currency)}
              </span>
              <span className="block text-[11px] font-label-sm text-outline">
                {Math.round(estimatedMargin)}% gross margin
              </span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between font-label-sm text-[11px] text-outline">
            <span>Total Units</span>
            <span className="font-semibold text-on-surface">
              {totalUnits} Units across {lineItems.length} lines
            </span>
          </div>
        </div>
      </div>

      {/* COLUMN 2: Deal Risk & Compliance */}
      <div
        className={`bg-white border rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between ${
          isHighRisk
            ? "border-[#FECDD3] bg-gradient-to-b from-white to-[#FFF5F5]"
            : isMediumRisk
            ? "border-[#FDE68A] bg-gradient-to-b from-white to-[#FFFDF5]"
            : "border-[#E5E7EB]"
        }`}
      >
        <div>
          <div
            className={`flex items-center justify-between pb-space-xs border-b ${
              isHighRisk ? "border-[#FECDD3]/50" : "border-[#F1F5F9]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`material-symbols-outlined text-sm ${
                  isHighRisk ? "text-[#E11D48]" : isMediumRisk ? "text-[#D97706]" : "text-[#10B981]"
                }`}
                data-icon="policy"
              >
                policy
              </span>
              <span
                className={`font-title-md text-title-md font-semibold ${
                  isHighRisk ? "text-[#9F1239]" : "text-on-surface"
                }`}
              >
                Deal Risk &amp; Compliance
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-label-sm font-bold ${
                isHighRisk
                  ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                  : isMediumRisk
                  ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                  : "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
              }`}
            >
              {isHighRisk ? "High Risk" : isMediumRisk ? "Medium Risk" : "Low Risk"} ({currentRisk}/100)
            </span>
          </div>

          {/* Horizontal Risk Score Meter */}
          <div className="mt-3">
            <div className="flex justify-between font-label-sm text-[10px] text-outline mb-1 font-semibold">
              <span>0 (Compliant)</span>
              <span>50</span>
              <span className={isHighRisk ? "text-[#E11D48]" : "text-[#D97706]"}>
                {currentRisk} (Current)
              </span>
              <span>100 (Violation)</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex relative p-0.5">
              <div className="w-1/3 bg-[#10B981] h-full rounded-l-full"></div>
              <div className="w-1/3 bg-[#F59E0B] h-full"></div>
              <div className="w-1/3 bg-[#E11D48] h-full rounded-r-full"></div>
              <div
                className="absolute top-0 bottom-0 w-1 bg-black ring-2 ring-white rounded-full transition-all"
                style={{ left: `${Math.min(Math.max(currentRisk, 0), 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Key Risk Alerts */}
          <div className="mt-3 space-y-2">
            {anomalyItems.length > 0 ? (
              anomalyItems.map((ai) => {
                const diff = (ai.discountLimitPercent !== null ? ai.discountPercent - ai.discountLimitPercent : 0);
                return (
                  <div
                    key={ai.id}
                    className="p-2 rounded bg-white/90 border border-[#FECDD3] flex items-start gap-2"
                  >
                    <span
                      className="material-symbols-outlined text-[#D97706] text-xs shrink-0 mt-0.5"
                      data-icon="warning"
                    >
                      warning
                    </span>
                    <p className="font-body-sm text-[11px] text-on-surface leading-tight">
                      <strong className="text-[#92400E]">Discount Anomaly:</strong>{" "}
                      {ai.productName} discount ({ai.discountPercent}%) exceeds limit ({ai.discountLimitPercent ?? 0}%)
                      {diff > 0 ? ` by ${diff.toFixed(0)}%` : ""}.
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-2 rounded bg-white/90 border border-[#A7F3D0] flex items-start gap-2">
                <span
                  className="material-symbols-outlined text-[#065F46] text-xs shrink-0 mt-0.5"
                  data-icon="check_circle"
                >
                  check_circle
                </span>
                <p className="font-body-sm text-[11px] text-[#065F46] leading-tight">
                  All discount allocations are within standard governance limits.
                </p>
              </div>
            )}

            {estimatedMargin < 40 && (
              <div className="p-2 rounded bg-white/90 border border-[#FECDD3] flex items-start gap-2">
                <span
                  className="material-symbols-outlined text-[#E11D48] text-xs shrink-0 mt-0.5"
                  data-icon="error"
                >
                  error
                </span>
                <p className="font-body-sm text-[11px] text-on-surface leading-tight">
                  <strong className="text-[#9F1239]">Margin Below Target:</strong> Blended gross margin (
                  {Math.round(estimatedMargin)}%) is {Math.round(40 - estimatedMargin)}% below company target threshold (40%).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN 3: Approval Routing Chain */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" data-icon="account_tree">
                account_tree
              </span>
              <span className="font-title-md text-title-md font-semibold text-on-surface">
                Approval Routing Chain
              </span>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-[#1E40AF] font-semibold">
              {workflowSteps.length > 0 ? `Tier ${workflowSteps.length} Escalation` : "Standard Route"}
            </span>
          </div>

          <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
            {workflowSteps.length > 0 ? (
              workflowSteps.map((step) => {
                const isApproved = step.status === "APPROVED";
                const isInProgress = step.status === "IN_PROGRESS";
                const isPending = step.status === "PENDING";
                const approverName = step.approver?.name || step.role;

                return (
                  <div
                    key={step.id}
                    className={`relative flex flex-col ${isPending ? "opacity-60" : ""}`}
                  >
                    {isApproved ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#ECFDF5] border-2 border-[#10B981] flex items-center justify-center">
                        <span
                          className="material-symbols-outlined text-[12px] text-[#065F46]"
                          data-icon="check"
                        >
                          check
                        </span>
                      </div>
                    ) : isInProgress ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#FFFBEB] border-2 border-[#D97706] flex items-center justify-center animate-pulse">
                        <span
                          className="material-symbols-outlined text-[12px] text-[#92400E]"
                          data-icon="pending"
                        >
                          pending
                        </span>
                      </div>
                    ) : (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-surface-bright border-2 border-[#D1D5DB] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-title-md text-body-md font-semibold text-on-surface">
                        Step {step.stepOrder}: {step.role}
                      </span>
                      <span
                        className={`font-label-sm text-[10px] font-bold uppercase ${
                          isApproved
                            ? "text-[#065F46]"
                            : isInProgress
                            ? "text-[#92400E]"
                            : "text-outline"
                        }`}
                      >
                        {isApproved ? "Auto-authorized" : isInProgress ? "Required" : "Pending"}
                      </span>
                    </div>
                    <span className="font-body-sm text-[11px] text-outline">
                      {approverName}
                    </span>
                    {step.notes && (
                      <span className="font-body-sm text-[10px] text-[#92400E]">
                        {step.notes}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              // Sensible default matching standard visual structure
              <>
                <div className="relative flex flex-col">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#ECFDF5] border-2 border-[#10B981] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-[#065F46]" data-icon="check">
                      check
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-title-md text-body-md font-semibold text-on-surface">
                      Step 1: Sales Manager
                    </span>
                    <span className="font-label-sm text-[10px] text-[#065F46] font-bold uppercase">
                      Auto-authorized
                    </span>
                  </div>
                  <span className="font-body-sm text-[11px] text-outline">
                    Standard Delegation Policy
                  </span>
                </div>
                <div className="relative flex flex-col">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#FFFBEB] border-2 border-[#D97706] flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-[12px] text-[#92400E]" data-icon="pending">
                      pending
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-title-md text-body-md font-semibold text-on-surface">
                      Step 2: Commercial Governance
                    </span>
                    <span className="font-label-sm text-[10px] text-[#92400E] font-bold uppercase">
                      Review Active
                    </span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant font-medium">
                    Commercial Approval Authority
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
