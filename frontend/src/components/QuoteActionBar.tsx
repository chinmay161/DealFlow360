"use client";

import React from "react";

interface QuoteActionBarProps {
  totalValue?: number;
  currency?: string;
  status?: string;
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const QuoteActionBar: React.FC<QuoteActionBarProps> = ({
  totalValue = 18300,
  currency = "USD",
  status,
}) => {
  return (
    <footer className="h-16 px-space-xl bg-white border-t border-[#E5E7EB] flex items-center justify-between flex-shrink-0 z-20 shadow-[0px_-4px_8px_rgba(15,23,42,0.03)]">
      {/* Left Actions */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="h-9 px-4 rounded-md bg-white border border-[#D1D5DB] text-on-surface hover:bg-[#F9FAFB] hover:border-[#9CA3AF] font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-sm text-outline" data-icon="save">
            save
          </span>
          <span>Save Draft</span>
        </button>
        <button
          type="button"
          className="h-9 px-4 rounded-md bg-white border border-[#D1D5DB] text-on-surface hover:bg-[#F9FAFB] hover:border-[#9CA3AF] font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-sm text-outline" data-icon="picture_as_pdf">
            picture_as_pdf
          </span>
          <span>Preview Quote / PDF</span>
        </button>
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
          className="h-10 px-5 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-title-md text-body-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors duration-150"
        >
          <span>{status === "IN_REVIEW" ? "Under Approval Review" : "Submit for Approval"}</span>
          <span className="material-symbols-outlined text-base" data-icon="send">
            send
          </span>
        </button>
      </div>
    </footer>
  );
};
