"use client";

import React from "react";
import Link from "next/link";

interface WorkspaceHeaderProps {
  quotationNumber?: string;
  customerTier?: string | null;
  priceList?: string | null;
  revisionText?: string | null;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  quotationNumber = "Q-1042",
  customerTier = null,
  priceList = null,
  revisionText = null,
}) => {
  return (
    <>
      {/* Breadcrumb & Deal Hierarchy */}
      <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
        <Link className="hover:text-primary transition-colors" href="/quotations?view=list">
          Quotations
        </Link>
        <span className="material-symbols-outlined text-xs" data-icon="chevron_right">
          chevron_right
        </span>
        <span className="text-on-surface-variant font-code-tabular">{quotationNumber}</span>
        <span className="material-symbols-outlined text-xs" data-icon="chevron_right">
          chevron_right
        </span>
        <span className="text-primary font-semibold">Edit Quotation</span>
      </div>

      {/* Header with Tier Badges (Full Width) */}
      <div className="flex items-center justify-between pb-space-xs">
        <div className="flex items-center gap-3">
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
            Create Quotation #{quotationNumber}
          </h1>

          {/* Customer Tier Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
            <span className="material-symbols-outlined text-xs text-[#D97706]" data-icon="workspace_premium">
              workspace_premium
            </span>
            <span>{customerTier || "Standard Tier"}</span>
          </div>

          {/* Price List Indicator */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-medium bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
            <span className="material-symbols-outlined text-xs" data-icon="sell">
              sell
            </span>
            <span>{priceList || "Standard Price List"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 px-3 rounded-md border border-[#D1D5DB] bg-white text-on-surface font-label-md text-label-md hover:bg-[#F9FAFB] flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm" data-icon="history">
              history
            </span>
            <span>{revisionText || "Revision History (v1)"}</span>
          </button>
        </div>
      </div>
    </>
  );
};
