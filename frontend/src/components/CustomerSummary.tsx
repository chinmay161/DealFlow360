"use client";

import React from "react";

export const CustomerSummary: React.FC = () => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] grid grid-cols-4 gap-space-lg">
      <div>
        <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">Account &amp; Customer</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">AC</div>
          <span className="font-title-md text-title-md font-semibold text-on-surface">Acme Corporation</span>
        </div>
        <span className="font-body-sm text-[11px] text-outline mt-0.5 block">Enterprise Global • ID: AC-88219</span>
      </div>
      <div>
        <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">Primary Buyer Contact</span>
        <span className="font-title-md text-body-md font-medium text-on-surface block">Sarah Jenkins</span>
        <span className="font-body-sm text-[11px] text-outline block">VP Procurement (s.jenkins@acme.com)</span>
      </div>
      <div>
        <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">Payment &amp; Terms</span>
        <div className="flex items-center gap-1.5">
          <span className="font-title-md text-body-md font-semibold text-on-surface">Net 45 Days</span>
          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1E40AF]">Standard</span>
        </div>
        <span className="font-body-sm text-[11px] text-outline block">Credit Line: $250,000.00 Active</span>
      </div>
      <div>
        <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">Sales Representative</span>
        <span className="font-title-md text-body-md font-medium text-on-surface block">James Carter</span>
        <span className="font-body-sm text-[11px] text-outline block">Territory: North America West</span>
      </div>
    </div>
  );
};
