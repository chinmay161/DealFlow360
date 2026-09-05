"use client";

import React from "react";
import { formatCurrency } from "@/lib/currency";
import type { LineItemDetail } from "../../types/manager.types";

interface ProductTableSectionProps {
  items: LineItemDetail[];
}

export const ProductTableSection: React.FC<ProductTableSectionProps> = ({ items }) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <h3 className="font-title-md text-sm font-bold text-on-surface">
          Quotation Line Items ({items.length})
        </h3>
        <span className="text-[11px] text-outline font-medium">Commercial Margin & Pricing Breakdown</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-on-surface">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[11px] font-bold text-outline uppercase tracking-wider">
            <tr>
              <th className="px-5 py-2.5">SKU</th>
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5 text-center">Quantity</th>
              <th className="px-4 py-2.5 text-right">Unit Price</th>
              <th className="px-4 py-2.5 text-center">Discount %</th>
              <th className="px-4 py-2.5 text-center">Margin %</th>
              <th className="px-5 py-2.5 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3 font-mono text-[11px] text-slate-500 font-semibold">
                  {item.sku}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-on-surface">{item.productName}</span>
                    {item.category && (
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-slate-700 tnum">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700 tnum">
                  {formatCurrency(item.unitPrice, "INR")}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold tnum ${
                      item.discountPercent > 18
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : item.discountPercent > 10
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.discountPercent}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold tnum ${
                      item.marginPercent >= 25
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {item.marginPercent}%
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-bold text-on-surface tnum">
                  {formatCurrency(item.totalAmount, "INR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
