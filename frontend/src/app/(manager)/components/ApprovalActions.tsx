"use client";

import React, { useState } from "react";
import { Check, X, RotateCcw, HelpCircle, Loader2 } from "lucide-react";
import { useApprovalMutations } from "../hooks/useApprovalMutations";

interface ApprovalActionsProps {
  approvalId: string;
  quotationNumber: string;
  totalAmount: string;
  customerName: string;
  canAct?: boolean;
  onSuccess?: () => void;
  className?: string;
}

type ActionModalType = "approve" | "reject" | "return" | "requestInfo" | null;

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  approvalId,
  quotationNumber,
  totalAmount,
  customerName,
  canAct = true,
  onSuccess,
  className = "",
}) => {
  const [activeModal, setActiveModal] = useState<ActionModalType>(null);
  const [comments, setComments] = useState("");
  const { approveMutation, rejectMutation, returnMutation, requestInfoMutation } =
    useApprovalMutations();

  const isPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    returnMutation.isPending ||
    requestInfoMutation.isPending;

  const handleConfirmAction = async () => {
    if (!approvalId) return;

    if (activeModal === "approve") {
      await approveMutation.mutateAsync({ approvalId, comments });
    } else if (activeModal === "reject") {
      await rejectMutation.mutateAsync({ approvalId, comments: comments || "Commercial concession rejected by Manager." });
    } else if (activeModal === "return") {
      await returnMutation.mutateAsync({ approvalId, comments: comments || "Revision required on discounting terms." });
    } else if (activeModal === "requestInfo") {
      await requestInfoMutation.mutateAsync({ approvalId, query: comments || "Clarification needed on delivery schedule and customer terms." });
    }

    setActiveModal(null);
    setComments("");
    if (onSuccess) onSuccess();
  };

  return (
    <>
      {/* Sticky Bottom Action Bar */}
      <div
        className={`sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-[#D1D5DB] px-6 py-3.5 shadow-lg shadow-slate-900/10 flex items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold text-outline tracking-wider">
              Governance Action Required
            </span>
            <span className="text-sm font-bold text-on-surface">
              Quote #{quotationNumber} • {customerName} ({totalAmount})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Request More Info Button */}
          <button
            type="button"
            onClick={() => setActiveModal("requestInfo")}
            disabled={!canAct || isPending}
            className="h-9 px-3.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            <span>Request Info</span>
          </button>

          {/* Return for Revision Button */}
          <button
            type="button"
            onClick={() => setActiveModal("return")}
            disabled={!canAct || isPending}
            className="h-9 px-3.5 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
            <span>Return for Revision</span>
          </button>

          {/* Reject Button */}
          <button
            type="button"
            onClick={() => setActiveModal("reject")}
            disabled={!canAct || isPending}
            className="h-9 px-4 rounded-md border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-rose-700" />
            <span>Reject</span>
          </button>

          {/* Approve Button */}
          <button
            type="button"
            onClick={() => setActiveModal("approve")}
            disabled={!canAct || isPending}
            className="h-9 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 stroke-[3]" />
            )}
            <span>Approve Deal</span>
          </button>
        </div>
      </div>

      {/* Confirmation & Comments Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-[#D1D5DB] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-on-surface">
                {activeModal === "approve" && "Confirm Quotation Approval"}
                {activeModal === "reject" && "Confirm Quotation Rejection"}
                {activeModal === "return" && "Return Quotation for Revision"}
                {activeModal === "requestInfo" && "Request Additional Information"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setComments("");
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-outline leading-relaxed">
              {activeModal === "approve" &&
                `Are you sure you want to approve quotation #${quotationNumber} for ${customerName} (${totalAmount})? This advances the quotation to commercial clearance.`}
              {activeModal === "reject" &&
                `Are you sure you want to reject quotation #${quotationNumber}? This halts the deal process and logs a rejection reason for the sales team.`}
              {activeModal === "return" &&
                `Send quotation #${quotationNumber} back to the sales representative for margin or discount adjustments.`}
              {activeModal === "requestInfo" &&
                `Send a clarification request to the sales representative before deciding on quotation #${quotationNumber}.`}
            </p>

            {/* Comments Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                <span>
                  {activeModal === "reject" || activeModal === "return"
                    ? "Mandatory Reason / Notes:"
                    : "Review Comments (Optional):"}
                </span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder={
                  activeModal === "reject"
                    ? "Specify policy violation or reason for commercial rejection..."
                    : activeModal === "return"
                    ? "Explain the adjustments needed before resubmission..."
                    : activeModal === "requestInfo"
                    ? "Enter questions regarding terms, delivery, or pricing..."
                    : "Add optional remarks for the audit trail..."
                }
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface placeholder-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setComments("");
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={
                  isPending ||
                  ((activeModal === "reject" || activeModal === "return") && !comments.trim())
                }
                className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 text-white transition-colors disabled:opacity-50 ${
                  activeModal === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : activeModal === "reject"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : activeModal === "return"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-primary hover:bg-[#1E3A8A]"
                }`}
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {activeModal === "approve" && "Confirm & Approve"}
                  {activeModal === "reject" && "Confirm Rejection"}
                  {activeModal === "return" && "Submit Return"}
                  {activeModal === "requestInfo" && "Send Inquiry"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
