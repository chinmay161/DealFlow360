"use client";

import React from "react";

export const QuoteLineItemsTable: React.FC = () => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Section Bar */}
      <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright">
        <div className="flex items-center gap-2">
          <span className="font-title-md text-title-md font-semibold text-on-surface">Line Items &amp; Commercial Structure</span>
          <span className="px-2 py-0.5 text-label-sm font-semibold rounded-full bg-surface-container-high text-primary">3 Products</span>
        </div>
        <div className="flex items-center gap-2 text-label-sm text-outline">
          <span>Currency: <strong>USD ($)</strong></span>
        </div>
      </div>

      {/* Enterprise Data Grid with Margin Column */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider">
              <th className="py-2.5 px-space-base font-semibold">Item &amp; SKU</th>
              <th className="py-2.5 px-space-md font-semibold text-right w-20">Qty</th>
              <th className="py-2.5 px-space-md font-semibold text-right w-28">Unit Price</th>
              <th className="py-2.5 px-space-md font-semibold text-right w-28">Discount (%)</th>
              <th className="py-2.5 px-space-md font-semibold text-right w-24">Limit (%)</th>
              <th className="py-2.5 px-space-md font-semibold text-right w-36">Est. Margin</th>
              <th className="py-2.5 px-space-md font-semibold text-right w-32">Line Total</th>
              <th className="py-2.5 px-space-base font-semibold w-44">Governance Status</th>
              <th className="py-2.5 px-space-md font-semibold text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">
            {/* ROW 1 */}
            <tr className="hover:bg-[#F8FAFC] transition-colors group">
              <td className="py-3 px-space-base">
                <div className="font-title-md text-body-md font-semibold text-on-surface">Laptop Pro 14</div>
                <div className="font-code-tabular text-[11px] text-outline">SKU: HW-LP14</div>
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-medium text-on-surface">
                10
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum text-on-surface">
                $1,200.00
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-semibold text-[#1E40AF]">
                12.0%
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum text-outline">
                15.0%
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum">
                <span className="font-semibold text-[#065F46]">42%</span>
                <span className="text-outline text-xs block font-normal">$4,435.20</span>
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                $10,560.00
              </td>
              <td className="py-3 px-space-base">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  <span className="material-symbols-outlined text-[13px]" data-icon="check_circle">check_circle</span>
                  Within Limit
                </span>
              </td>
              <td className="py-3 px-space-md text-center">
                <div className="flex items-center justify-center gap-1">
                  <button className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors" title="Edit Item">
                    <span className="material-symbols-outlined text-sm" data-icon="edit">edit</span>
                  </button>
                  <button className="p-1 rounded text-outline hover:text-error hover:bg-red-50 transition-colors" title="Delete Item">
                    <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
                  </button>
                </div>
              </td>
            </tr>

            {/* ROW 2 (Over Limit Anomaly) */}
            <tr className="hover:bg-[#FFFDF5] bg-[#FFFDF5]/40 transition-colors group">
              <td className="py-3 px-space-base">
                <div className="font-title-md text-body-md font-semibold text-on-surface flex items-center gap-1.5">
                  <span>Enterprise Setup &amp; Migration</span>
                  <span className="material-symbols-outlined text-[#D97706] text-xs" title="Discount exceeds standard limit">warning</span>
                </div>
                <div className="font-code-tabular text-[11px] text-outline">SKU: SRV-MIG</div>
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-medium text-on-surface">
                1
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum text-on-surface">
                $4,000.00
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-[#B45309]">
                18.0%
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum text-outline">
                10.0%
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum">
                <span className="font-semibold text-[#B45309]">28%</span>
                <span className="text-outline text-xs block font-normal">$918.40</span>
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                $3,280.00
              </td>
              <td className="py-3 px-space-base">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                  <span className="material-symbols-outlined text-[13px]" data-icon="priority_high">priority_high</span>
                  Over Limit (+8%)
                </span>
              </td>
              <td className="py-3 px-space-md text-center">
                <div className="flex items-center justify-center gap-1">
                  <button className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors" title="Edit Item">
                    <span className="material-symbols-outlined text-sm" data-icon="edit">edit</span>
                  </button>
                  <button className="p-1 rounded text-outline hover:text-error hover:bg-red-50 transition-colors" title="Delete Item">
                    <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
                  </button>
                </div>
              </td>
            </tr>

            {/* ROW 3 */}
            <tr className="hover:bg-[#F8FAFC] transition-colors group">
              <td className="py-3 px-space-base">
                <div className="font-title-md text-body-md font-semibold text-on-surface">27-inch 4K Studio Display</div>
                <div className="font-code-tabular text-[11px] text-outline">SKU: HW-DSP27</div>
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-medium text-on-surface">
                5
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum text-on-surface">
                $650.00
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-semibold text-[#1E40AF]">
                8.0%
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum text-outline">
                15.0%
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum">
                <span className="font-semibold text-[#065F46]">38%</span>
                <span className="text-outline text-xs block font-normal">$1,136.20</span>
              </td>
              <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                $2,990.00
              </td>
              <td className="py-3 px-space-base">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  <span className="material-symbols-outlined text-[13px]" data-icon="check_circle">check_circle</span>
                  Within Limit
                </span>
              </td>
              <td className="py-3 px-space-md text-center">
                <div className="flex items-center justify-center gap-1">
                  <button className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors" title="Edit Item">
                    <span className="material-symbols-outlined text-sm" data-icon="edit">edit</span>
                  </button>
                  <button className="p-1 rounded text-outline hover:text-error hover:bg-red-50 transition-colors" title="Delete Item">
                    <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table Actions Footer Row */}
      <div className="p-space-sm bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <button className="h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright flex items-center gap-1.5 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm text-primary" data-icon="add">add</span>
            <span>+ Add Product Line Item</span>
          </button>
          <button className="h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface-variant font-label-md text-label-md font-medium hover:bg-surface-bright flex items-center gap-1.5 transition-colors">
            <span className="material-symbols-outlined text-sm" data-icon="library_add">library_add</span>
            <span>Quick Add Bundle</span>
          </button>
        </div>
        <div className="font-body-sm text-body-sm text-outline">
          <span>Lines: <strong>3</strong> | Total Unit Count: <strong>16 Units</strong></span>
        </div>
      </div>
    </div>
  );
};
