"use client";

import React from "react";

export const RecommendationSection: React.FC = () => {
  return (
    <div className="space-y-space-sm pt-space-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm" data-icon="auto_awesome">auto_awesome</span>
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">Recommended for this Deal</h2>
          <span className="text-label-sm font-label-sm text-outline">AI-Driven Cross-Sell Suggestions</span>
        </div>
        <span className="font-label-sm text-label-sm text-secondary cursor-pointer hover:underline">View catalog engine (14 available)</span>
      </div>
      <div className="grid grid-cols-3 gap-space-base">
        {/* Rec Card 1 */}
        <div className="p-space-base bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] hover:border-secondary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-title-md text-body-md font-semibold text-on-surface leading-tight">Universal Thunderbolt 4 Docking Station</h3>
                <span className="font-body-sm text-[11px] text-outline">SKU: ACC-TB4-DK</span>
              </div>
              <span className="px-2 py-0.5 rounded text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
                +$82 margin
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Frequently purchased with <strong className="font-medium text-on-surface">Laptop Pro 14</strong> (84% attach rate in Gold accounts).
            </p>
          </div>
          <div className="mt-space-md pt-space-sm border-t border-[#F1F5F9] flex items-center justify-between">
            <div className="font-code-tabular text-body-md font-bold text-on-surface tnum">
              $240.00 <span className="text-outline text-xs font-normal">/ unit</span>
            </div>
            <button className="h-7 px-3 rounded bg-surface-container-low hover:bg-surface-container-high text-primary text-label-md font-label-md font-semibold transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-xs" data-icon="add">add</span>
              <span>Add to Quote</span>
            </button>
          </div>
        </div>

        {/* Rec Card 2 */}
        <div className="p-space-base bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] hover:border-secondary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-title-md text-body-md font-semibold text-on-surface leading-tight">3-Year Enterprise Care Plan Pro</h3>
                <span className="font-body-sm text-[11px] text-outline">SKU: SVC-CARE3Y</span>
              </div>
              <span className="px-2 py-0.5 rounded text-label-sm font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] shrink-0">
                +$490/yr ARR
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Recommended standard warranty for <strong className="font-medium text-on-surface">Gold Tier accounts</strong> with hardware deployments.
            </p>
          </div>
          <div className="mt-space-md pt-space-sm border-t border-[#F1F5F9] flex items-center justify-between">
            <div className="font-code-tabular text-body-md font-bold text-on-surface tnum">
              $1,470.00 <span className="text-outline text-xs font-normal">/ 3-yr total</span>
            </div>
            <button className="h-7 px-3 rounded bg-surface-container-low hover:bg-surface-container-high text-primary text-label-md font-label-md font-semibold transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-xs" data-icon="add">add</span>
              <span>Add to Quote</span>
            </button>
          </div>
        </div>

        {/* Rec Card 3 (Enterprise Accessory) */}
        <div className="p-space-base bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] hover:border-secondary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-title-md text-body-md font-semibold text-on-surface leading-tight">100W USB-C Dual Power Adapter</h3>
                <span className="font-body-sm text-[11px] text-outline">SKU: PWR-100W-2C</span>
              </div>
              <span className="px-2 py-0.5 rounded text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
                +$34 margin
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              High-demand peripheral accessory bundled with multi-monitor workstation packages.
            </p>
          </div>
          <div className="mt-space-md pt-space-sm border-t border-[#F1F5F9] flex items-center justify-between">
            <div className="font-code-tabular text-body-md font-bold text-on-surface tnum">
              $79.00 <span className="text-outline text-xs font-normal">/ unit</span>
            </div>
            <button className="h-7 px-3 rounded bg-surface-container-low hover:bg-surface-container-high text-primary text-label-md font-label-md font-semibold transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-xs" data-icon="add">add</span>
              <span>Add to Quote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
