"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { submitCounterOfferAction, acceptQuotationAction } from "@/lib/actions/portalActions";

interface NegotiationItem {
  id: string;
  proposedDiscount?: number | null;
  comments: string;
  status: string;
  createdAt: string;
}

interface CustomerNegotiationBoxProps {
  quotationId: string;
  quotationNumber: string;
  currentStatus: string;
  negotiations: NegotiationItem[];
  defaultSignatory?: {
    name: string;
    title?: string | null;
    email: string;
  } | null;
}

export const CustomerNegotiationBox: React.FC<CustomerNegotiationBoxProps> = ({
  quotationId,
  quotationNumber,
  currentStatus,
  negotiations,
  defaultSignatory,
}) => {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [targetDiscount, setTargetDiscount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signatoryName, setSignatoryName] = useState(defaultSignatory?.name || "Procurement Officer");
  const [signatoryTitle, setSignatoryTitle] = useState(defaultSignatory?.title || "Commercial Buyer");
  const [signatoryEmail, setSignatoryEmail] = useState(defaultSignatory?.email || "procurement@commercial.in");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAccepted = currentStatus === "ACCEPTED";

  const handleCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await submitCounterOfferAction({
        quotationId,
        comments: commentText,
        proposedDiscount: targetDiscount ? parseFloat(targetDiscount) : undefined,
        actorName: signatoryName,
      });

      setCommentText("");
      setTargetDiscount("");
      setSuccessMessage("Counter-offer submitted to the DealFlow360 sales & finance committee for review!");
      setTimeout(() => setSuccessMessage(null), 5000);
      router.refresh();
    } catch (err) {
      console.error("Failed to submit counter offer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignAndAccept = async () => {
    setIsSigning(true);
    try {
      await acceptQuotationAction({
        quotationId,
        signatoryName,
        signatoryTitle,
        signatoryEmail,
      });

      setIsSignModalOpen(false);
      setSuccessMessage("Quotation accepted & signed! Fulfillment and initial invoice have been dispatched.");
      setTimeout(() => setSuccessMessage(null), 6000);
      router.refresh();
    } catch (err) {
      console.error("Failed to sign and accept quotation:", err);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
        <div>
          <h3 className="font-title-md text-base font-bold text-on-surface">
            Commercial Collaboration &amp; Formal Acceptance
          </h3>
          <p className="text-body-sm text-xs text-outline mt-0.5">
            Discuss terms, request price concessions, or sign and execute the agreement.
          </p>
        </div>

        {!isAccepted ? (
          <button
            type="button"
            onClick={() => setIsSignModalOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm" data-icon="draw">
              draw
            </span>
            <span>Accept &amp; Sign Proposal</span>
          </button>
        ) : (
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm" data-icon="verified">
              verified
            </span>
            <span>Proposal Signed &amp; Active</span>
          </span>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-base" data-icon="check_circle">
            check_circle
          </span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Negotiation History */}
      {negotiations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-outline uppercase tracking-wider">
            Discussion Thread ({negotiations.length})
          </h4>
          <div className="space-y-2">
            {negotiations.map((neg) => (
              <div
                key={neg.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-outline">
                  <span className="font-semibold text-on-surface">Customer Procurement Team</span>
                  <span>{neg.createdAt}</span>
                </div>
                <p className="text-on-surface font-medium">{neg.comments}</p>
                {neg.proposedDiscount && (
                  <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                    Requested Discount: {neg.proposedDiscount}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Counter-offer submission form */}
      {!isAccepted && (
        <form onSubmit={handleCounterOffer} className="space-y-3 pt-2">
          <label className="block">
            <span className="text-xs font-semibold text-on-surface block mb-1">
              Submit Counter-Offer or Inquiry:
            </span>
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="e.g. We would like to close this quarter if we can achieve an additional 3% concession on the Hardware line..."
              className="w-full p-3 rounded-lg border border-[#D1D5DB] text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </label>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-outline">Optional Target Discount %:</span>
              <input
                type="number"
                min="0"
                max="50"
                value={targetDiscount}
                onChange={(e) => setTargetDiscount(e.target.value)}
                placeholder="20"
                className="w-20 px-2 py-1 rounded border border-[#D1D5DB] text-xs font-code-tabular text-right"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-label-md text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Send to Account Executive"}
            </button>
          </div>
        </form>
      )}

      {/* Signature & Acceptance Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-xl" data-icon="verified_user">
                  verified_user
                </span>
                <h4 className="font-title-md text-sm font-bold text-on-surface">
                  Sign &amp; Execute Agreement ({quotationNumber})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg" data-icon="close">
                  close
                </span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              By typing your legal signatory credentials below, you authorize DealFlow360 and its logistics partners to fulfill this commercial proposal under Indian law.
            </p>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  Authorized Signatory Name
                </span>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-xs"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  Corporate Title / Designation
                </span>
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-xs"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  Corporate Email
                </span>
                <input
                  type="email"
                  value={signatoryEmail}
                  onChange={(e) => setSignatoryEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-xs"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-3 py-1.5 border rounded-md text-xs font-semibold text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSigning}
                onClick={handleSignAndAccept}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSigning ? "Recording Signature..." : "Confirm & Execute Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
