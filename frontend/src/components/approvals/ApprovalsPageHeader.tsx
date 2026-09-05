"use client";

import React from "react";

interface ApprovalsPageHeaderProps {
  pendingCount?: number;
}

export const ApprovalsPageHeader: React.FC<ApprovalsPageHeaderProps> = ({
  pendingCount = 12,
}) => {
  return (
    <div className="flex items-center justify-between pb-space-xs">
      <div>
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
          Approvals
        </h1>
        <p className="font-body-sm text-body-sm text-outline mt-0.5">
          Review and manage deals requiring commercial approval.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Compact summary indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse"></span>
          <span className="font-label-sm text-label-sm font-semibold">
            {pendingCount} Pending
          </span>
        </div>

        <div className="h-4 w-px bg-[#E5E7EB]"></div>

        {/* Action control: Refresh only */}
        <button
          onClick={() => window.location.reload()}
          className="h-8 px-2.5 rounded-md border border-[#D1D5DB] bg-white text-on-surface font-label-md text-label-md hover:bg-[#F9FAFB] flex items-center gap-1 text-on-surface-variant transition-colors shadow-sm cursor-pointer"
          title="Refresh Queue"
        >
          <span className="material-symbols-outlined text-sm text-outline" data-icon="refresh">
            refresh
          </span>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

