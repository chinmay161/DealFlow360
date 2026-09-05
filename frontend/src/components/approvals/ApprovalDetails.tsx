"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ApprovalItem } from "@/types/approval";

interface ApprovalDetailsProps {
  approval: ApprovalItem;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onRequestChanges?: (id: string) => void;
}

export const ApprovalDetails: React.FC<ApprovalDetailsProps> = ({
  approval,
  onApprove,
  onReject,
  onRequestChanges,
}) => {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleAction = (type: "approved" | "rejected" | "changes") => {
    if (type === "approved") {
      setActionFeedback("Approval granted successfully.");
      onApprove?.(approval.id);
    } else if (type === "rejected") {
      setActionFeedback("Deal has been rejected.");
      onReject?.(approval.id);
    } else {
      setActionFeedback("Changes requested from sales representative.");
      onRequestChanges?.(approval.id);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between overflow-hidden">
      {/* Scrollable Details Body */}
      <div className="p-space-base space-y-space-base overflow-y-auto max-h-[calc(100vh-280px)]">
        {/* TOP SECTION: Header & Identity */}
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base" data-icon="verified">
                verified
              </span>
              <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                Approval Details
              </h2>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-label-sm font-semibold ${
                approval.priority === "High"
                  ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                  : "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
              }`}
            >
              {approval.priority} Priority
            </span>
          </div>

          {/* Deal Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-bright border border-[#E5E7EB]">
            <div>
              <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
                Deal Reference
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-code-tabular text-body-md font-bold text-primary">
                  {approval.dealId}
                </span>
                <span className="font-label-sm text-outline">•</span>
                <span className="font-body-sm text-xs font-semibold text-on-surface">
                  {approval.customer}
                </span>
              </div>
            </div>

            <div>
              <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
                Quote Value
              </span>
              <span className="font-code-tabular text-body-md font-bold text-on-surface tnum block mt-0.5">
                {approval.value}
              </span>
            </div>

            <div>
              <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
                Submitted
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant block mt-0.5">
                {approval.submittedTimeAgo} ({approval.submittedExactTime || "Earlier"})
              </span>
            </div>

            <div>
              <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider">
                Requested By
              </span>
              <span className="font-body-sm text-xs font-medium text-on-surface block mt-0.5">
                {approval.requestedBy.name}
              </span>
              <span className="font-body-sm text-[11px] text-outline block">
                {approval.requestedBy.role}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION: WHY APPROVAL IS REQUIRED */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="material-symbols-outlined text-[#D97706] text-sm" data-icon="policy">
              policy
            </span>
            <h3 className="font-title-md text-body-md font-semibold text-on-surface">
              Why Approval Is Required
            </h3>
          </div>

          <div className="space-y-2">
            {approval.reasons.map((reason) => (
              <div
                key={reason.id}
                className="p-2.5 rounded-md border border-[#FECDD3] bg-gradient-to-r from-white to-[#FFF5F5] flex flex-col gap-1 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-xs font-bold text-[#9F1239] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#E11D48]" data-icon="warning">
                      warning
                    </span>
                    {reason.title}
                  </span>
                  <span className="text-[10px] font-label-sm font-semibold px-1.5 py-0.2 rounded bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
                    Exception
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-body-sm text-[11px] pt-1">
                  <div>
                    <span className="text-outline">Requested: </span>
                    <strong className="text-on-surface font-semibold">{reason.requestedValue}</strong>
                  </div>
                  <div>
                    <span className="text-outline">Allowed limit: </span>
                    <strong className="text-on-surface font-semibold">{reason.allowedLimit}</strong>
                  </div>
                </div>

                <p className="font-body-sm text-[11px] text-[#92400E] font-medium pt-0.5">
                  • {reason.exceptionText}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: FINANCIAL OVERVIEW */}
        <div>
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9] mb-2">
            <h3 className="font-title-md text-body-md font-semibold text-on-surface">
              Financial Overview
            </h3>
            <span className="text-[11px] font-label-sm text-outline">INR (₹)</span>
          </div>

          <div className="space-y-1.5 font-body-sm text-xs">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-code-tabular tnum text-on-surface font-medium">
                {approval.financials.subtotal}
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Discount</span>
              <span className="font-code-tabular tnum text-[#9F1239] font-medium">
                {approval.financials.discount}
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Estimated GST</span>
              <span className="font-code-tabular tnum text-on-surface font-medium">
                {approval.financials.estimatedTax}
              </span>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-[#E5E7EB] flex items-baseline justify-between">
            <div>
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider block">
                Net Total
              </span>
              <span className="font-metric-display text-lg font-bold text-primary tnum">
                {approval.financials.netTotal}
              </span>
            </div>
            <div className="text-right">
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider block">
                Est. Margin
              </span>
              <span className="font-title-md text-body-md font-bold text-[#065F46] tnum">
                {approval.financials.estMargin}
              </span>
              <span className="block text-[10px] font-label-sm text-outline">
                {approval.financials.marginPercentage}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION: APPROVAL WORKFLOW */}
        <div>
          <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9] mb-3">
            <h3 className="font-title-md text-body-md font-semibold text-on-surface">
              Approval Workflow
            </h3>
            <span className="text-label-sm text-[10px] font-semibold text-[#1E40AF] px-1.5 py-0.2 rounded bg-surface-container">
              Routing Chain
            </span>
          </div>

          <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
            {approval.workflow.map((step) => {
              const isCompleted = step.status === "Completed";
              const isCurrent = step.status === "Current";

              return (
                <div key={step.stepNumber} className={`relative flex flex-col ${!isCompleted && !isCurrent ? "opacity-60" : ""}`}>
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-[#ECFDF5] border-2 border-[#10B981]"
                        : isCurrent
                        ? "bg-[#EFF6FF] border-2 border-secondary animate-pulse"
                        : "bg-surface-bright border-2 border-[#D1D5DB]"
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[12px] text-[#065F46]" data-icon="check">
                        check
                      </span>
                    ) : isCurrent ? (
                      <span className="material-symbols-outlined text-[12px] text-secondary" data-icon="pending">
                        pending
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-title-md text-xs font-semibold text-on-surface">
                      Step {step.stepNumber}: {step.role}
                    </span>
                    <span
                      className={`font-label-sm text-[10px] font-bold uppercase ${
                        isCompleted
                          ? "text-[#065F46]"
                          : isCurrent
                          ? "text-secondary"
                          : "text-outline"
                      }`}
                    >
                      {step.statusLabel}
                    </span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant font-medium">
                    {step.assignee}
                  </span>
                  {step.delegatedLimitOrTrigger && (
                    <span className="font-body-sm text-[10px] text-outline">
                      {step.delegatedLimitOrTrigger}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: APPROVAL HISTORY */}
        <div>
          <h3 className="font-title-md text-body-md font-semibold text-on-surface pb-1 border-b border-[#F1F5F9] mb-2">
            Approval History
          </h3>
          <div className="space-y-2">
            {approval.history.map((evt) => (
              <div key={evt.id} className="flex items-start gap-2.5 text-body-sm text-[11px]">
                <span className="font-code-tabular font-medium text-outline shrink-0 w-16 text-right">
                  {evt.time}
                </span>
                <span className="text-on-surface-variant leading-tight">
                  {evt.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* OPTIONAL SECONDARY DETAILS: Quick links */}
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-label-sm text-xs text-secondary">
          <Link href={approval.quoteUrl || "/"} className="hover:underline flex items-center gap-0.5">
            <span>View Full Quote</span>
            <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">arrow_forward</span>
          </Link>
          <a href="#" className="hover:underline flex items-center gap-0.5">
            <span>View Customer</span>
            <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">arrow_forward</span>
          </a>
          <a href="#" className="hover:underline flex items-center gap-0.5">
            <span>View Deal Intelligence</span>
            <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">arrow_forward</span>
          </a>
        </div>
      </div>

      {/* STICKY APPROVAL ACTION AREA */}
      <div className="p-space-base bg-[#F8F9FA] border-t border-[#E5E7EB]">
        {actionFeedback && (
          <div className="mb-2 p-2 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-label-sm text-[#1E40AF] font-medium flex items-center gap-1.5 animate-fadeIn">
            <span className="material-symbols-outlined text-xs" data-icon="info">info</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {/* Reject */}
          <button
            onClick={() => handleAction("rejected")}
            className="h-9 px-3 rounded-md border border-[#FECDD3] bg-white text-[#E11D48] hover:bg-[#FFF1F2] font-label-md text-label-md font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm" data-icon="close">close</span>
            <span>Reject</span>
          </button>

          {/* Request Changes */}
          <button
            onClick={() => handleAction("changes")}
            className="h-9 px-3 rounded-md border border-[#D1D5DB] bg-white text-on-surface hover:bg-[#F9FAFB] font-label-md text-label-md font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-outline" data-icon="edit_note">edit_note</span>
            <span>Request Changes</span>
          </button>

          {/* Approve */}
          <button
            onClick={() => handleAction("approved")}
            className="h-9 px-3 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm" data-icon="check_circle">check_circle</span>
            <span>Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
};
