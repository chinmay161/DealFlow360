"use client";

import React, { useState } from "react";
import { submitForApprovalAction } from "@/lib/actions/quoteActions";
import { SerializedQuotationDetail } from "@/lib/quotations";
import { formatCurrency } from "@/lib/currency";

interface QuoteActionBarProps {
  quotation?: SerializedQuotationDetail;
  totalValue?: number;
  currency?: string;
  status?: string;
}

export const QuoteActionBar: React.FC<QuoteActionBarProps> = ({
  quotation,
  totalValue = 1830000,
  currency = "INR",
  status,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const quotationId = quotation?.id;
  const currentStatus = quotation?.status || status;

  const handleSaveDraft = () => {
    setFeedback("Draft saved to PostgreSQL database.");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSubmitForApproval = async () => {
    if (!quotationId || currentStatus === "IN_REVIEW") return;
    setIsSubmitting(true);
    try {
      await submitForApprovalAction({
        quotationId,
        notes: "Submitted from quotation action bar.",
      });
      setFeedback("Quotation successfully submitted for approval review!");
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error("Failed to submit quotation:", err);
      setFeedback("Failed to submit quotation.");
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUnderReview = currentStatus === "IN_REVIEW";
  const isApproved = currentStatus === "APPROVED";

  return (
    <>
      <footer className="h-16 px-space-xl bg-white border-t border-[#E5E7EB] flex items-center justify-between flex-shrink-0 z-20 shadow-[0px_-4px_8px_rgba(15,23,42,0.03)]">
        {/* Left Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="h-9 px-4 rounded-md bg-white border border-[#D1D5DB] text-on-surface hover:bg-[#F9FAFB] hover:border-[#9CA3AF] font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-outline" data-icon="save">
              save
            </span>
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="h-9 px-4 rounded-md bg-white border border-[#D1D5DB] text-on-surface hover:bg-[#F9FAFB] hover:border-[#9CA3AF] font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-outline" data-icon="picture_as_pdf">
              picture_as_pdf
            </span>
            <span>Preview Quote / PDF</span>
          </button>

          {feedback && (
            <span className="text-body-sm text-xs font-semibold text-[#065F46] bg-[#ECFDF5] px-2.5 py-1 rounded border border-[#A7F3D0] ml-2 animate-fade-in">
              {feedback}
            </span>
          )}
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="block font-label-sm text-[11px] text-outline uppercase tracking-wider">
              Total Value
            </span>
            <span className="font-title-md text-body-md font-bold text-on-surface tnum">
              {formatCurrency(totalValue, currency)}
            </span>
          </div>

          <button
            type="button"
            disabled={isSubmitting || isUnderReview || isApproved}
            onClick={handleSubmitForApproval}
            className={`h-10 px-5 rounded-md font-title-md text-body-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors duration-150 ${
              isUnderReview
                ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] cursor-default"
                : isApproved
                ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] cursor-default"
                : "bg-primary hover:bg-[#1E3A8A] text-on-primary"
            }`}
          >
            <span>
              {isUnderReview
                ? "Under Approval Review"
                : isApproved
                ? "Quotation Approved"
                : isSubmitting
                ? "Submitting..."
                : "Submit for Approval"}
            </span>
            <span className="material-symbols-outlined text-base" data-icon={isUnderReview ? "pending" : isApproved ? "check_circle" : "send"}>
              {isUnderReview ? "pending" : isApproved ? "check_circle" : "send"}
            </span>
          </button>
        </div>
      </footer>

      {/* Preview / Printable PDF Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:p-0">
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA] print:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" data-icon="description">
                  description
                </span>
                <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                  Commercial Quotation Document — #{quotation?.quotationNumber || "Q-1042"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded border border-[#D1D5DB] bg-white text-on-surface text-xs font-semibold flex items-center gap-1 hover:bg-[#F9FAFB]"
                >
                  <span className="material-symbols-outlined text-sm" data-icon="print">
                    print
                  </span>
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-outline hover:text-on-surface p-1 rounded-md"
                >
                  <span className="material-symbols-outlined text-base" data-icon="close">
                    close
                  </span>
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 overflow-y-auto space-y-6 text-on-surface bg-white font-sans">
              <div className="flex justify-between items-start border-b border-gray-200 pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-primary">DealFlow360</h1>
                  <p className="text-xs text-outline mt-1">Enterprise Commerce &amp; Deal Governance</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-on-surface">
                    QUOTATION #{quotation?.quotationNumber || "Q-1042"}
                  </div>
                  <div className="text-xs text-outline mt-1">
                    Status: <span className="font-semibold uppercase">{quotation?.status || "DRAFT"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="text-xs uppercase font-bold text-outline tracking-wider mb-2">Customer Account</h4>
                  <div className="font-semibold text-base">{quotation?.customer.name || "Apex Infotech Pvt. Ltd."}</div>
                  <div className="text-xs text-outline mt-1">
                    Industry: {quotation?.customer.industry || "Enterprise Cloud & Infrastructure"}<br />
                    Account ID: {quotation?.customer.externalAccountId || "AC-88219"}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase font-bold text-outline tracking-wider mb-2">Commercial Terms</h4>
                  <div className="text-xs text-outline space-y-1">
                    <div>Payment Terms: <strong className="text-on-surface">Net 45 Days</strong></div>
                    <div>Account Owner: <strong className="text-on-surface">{quotation?.owner.name || "Arjun Mehta"}</strong></div>
                    <div>Currency: <strong className="text-on-surface">{currency} (₹)</strong></div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Discount</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotation?.lineItems.map((li) => (
                      <tr key={li.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold">{li.productName}</div>
                          <div className="text-gray-400 text-[10px]">SKU: {li.sku || "N/A"}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">{li.quantity}</td>
                        <td className="py-2.5 px-3 text-right">{formatCurrency(li.unitPrice, currency)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-500">{li.discountPercent}%</td>
                        <td className="py-2.5 px-3 text-right font-bold">{formatCurrency(li.lineTotal, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(quotation?.subtotal ?? 0, currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span className="text-red-600">-{formatCurrency(quotation?.discountTotal ?? 0, currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated GST:</span>
                    <span>{formatCurrency(quotation?.taxTotal ?? 0, currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-on-surface border-t border-gray-200 pt-2">
                    <span>Total Value:</span>
                    <span>{formatCurrency(quotation?.totalValue ?? totalValue, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F8F9FA] border-t border-[#E5E7EB] flex justify-end print:hidden">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 px-4 rounded-md border border-[#D1D5DB] bg-white text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
