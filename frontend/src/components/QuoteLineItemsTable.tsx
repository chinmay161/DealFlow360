"use client";

import React from "react";
import { SerializedQuoteLineItem } from "@/lib/quotations";

interface QuoteLineItemsTableProps {
  lineItems?: SerializedQuoteLineItem[];
  currency?: string;
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

export const QuoteLineItemsTable: React.FC<QuoteLineItemsTableProps> = ({
  lineItems = [],
  currency = "USD",
}) => {
  const totalUnits = lineItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Section Bar */}
      <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright">
        <div className="flex items-center gap-2">
          <span className="font-title-md text-title-md font-semibold text-on-surface">
            Line Items &amp; Commercial Structure
          </span>
          <span className="px-2 py-0.5 text-label-sm font-semibold rounded-full bg-surface-container-high text-primary">
            {lineItems.length} Products
          </span>
        </div>
        <div className="flex items-center gap-2 text-label-sm text-outline">
          <span>
            Currency: <strong>{currency} ($)</strong>
          </span>
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
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-outline text-body-md">
                  No line items configured for this quotation.
                </td>
              </tr>
            ) : (
              lineItems.map((item) => {
                const isOverLimit =
                  (item.governanceStatus && item.governanceStatus.toLowerCase().includes("over")) ||
                  (item.discountLimitPercent !== null && item.discountPercent > item.discountLimitPercent);

                const marginPercent = item.estimatedMarginPercent ?? 0;
                const dollarMargin = item.lineTotal * (marginPercent / 100);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors group ${
                      isOverLimit
                        ? "bg-[#FFFDF5]/40 hover:bg-[#FFFDF5]"
                        : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {/* Item & SKU */}
                    <td className="py-3 px-space-base">
                      <div className="font-title-md text-body-md font-semibold text-on-surface flex items-center gap-1.5">
                        <span>{item.productName}</span>
                        {isOverLimit && (
                          <span
                            className="material-symbols-outlined text-[#D97706] text-xs"
                            title="Discount exceeds standard limit"
                            data-icon="warning"
                          >
                            warning
                          </span>
                        )}
                      </div>
                      <div className="font-code-tabular text-[11px] text-outline">
                        SKU: {item.sku || "N/A"}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-space-md text-right font-code-tabular tnum font-medium text-on-surface">
                      {item.quantity}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-space-md text-right font-code-tabular tnum text-on-surface">
                      {formatCurrency(item.unitPrice, currency)}
                    </td>

                    {/* Discount (%) */}
                    <td
                      className={`py-3 px-space-md text-right font-code-tabular tnum ${
                        isOverLimit
                          ? "font-bold text-[#B45309]"
                          : "font-semibold text-[#1E40AF]"
                      }`}
                    >
                      {formatPercent(item.discountPercent)}
                    </td>

                    {/* Limit (%) */}
                    <td className="py-3 px-space-md text-right font-code-tabular tnum text-outline">
                      {formatPercent(item.discountLimitPercent)}
                    </td>

                    {/* Est. Margin */}
                    <td className="py-3 px-space-md text-right font-code-tabular tnum">
                      <span
                        className={`font-semibold ${
                          isOverLimit ? "text-[#B45309]" : "text-[#065F46]"
                        }`}
                      >
                        {Math.round(marginPercent)}%
                      </span>
                      <span className="text-outline text-xs block font-normal">
                        {formatCurrency(dollarMargin, currency)}
                      </span>
                    </td>

                    {/* Line Total */}
                    <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                      {formatCurrency(item.lineTotal, currency)}
                    </td>

                    {/* Governance Status */}
                    <td className="py-3 px-space-base">
                      {isOverLimit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                          <span
                            className="material-symbols-outlined text-[13px]"
                            data-icon="priority_high"
                          >
                            priority_high
                          </span>
                          {item.governanceStatus || "Over Limit"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                          <span
                            className="material-symbols-outlined text-[13px]"
                            data-icon="check_circle"
                          >
                            check_circle
                          </span>
                          {item.governanceStatus || "Within Limit"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-space-md text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors"
                          title="Edit Item"
                        >
                          <span className="material-symbols-outlined text-sm" data-icon="edit">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded text-outline hover:text-error hover:bg-red-50 transition-colors"
                          title="Delete Item"
                        >
                          <span className="material-symbols-outlined text-sm" data-icon="delete">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Actions Footer Row */}
      <div className="p-space-sm bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            className="h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-primary" data-icon="add">
              add
            </span>
            <span>+ Add Product Line Item</span>
          </button>
          <button
            type="button"
            className="h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface-variant font-label-md text-label-md font-medium hover:bg-surface-bright flex items-center gap-1.5 transition-colors"
          >
            <span
              className="material-symbols-outlined text-sm"
              data-icon="library_add"
            >
              library_add
            </span>
            <span>Quick Add Bundle</span>
          </button>
        </div>
        <div className="font-body-sm text-body-sm text-outline">
          <span>
            Lines: <strong>{lineItems.length}</strong> | Total Unit Count:{" "}
            <strong>{totalUnits} Units</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
