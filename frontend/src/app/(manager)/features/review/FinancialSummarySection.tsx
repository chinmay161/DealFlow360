"use client";

import React from "react";
import { formatCurrency } from "@/lib/currency";

interface FinancialSummarySectionProps {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  estimatedMargin: number;
  marginAmount: number;
  totalValue: number;
}

export const FinancialSummarySection: React.FC<FinancialSummarySectionProps> = ({
  subtotal,
  discountTotal,
  taxTotal,
  estimatedMargin,
  marginAmount,
  totalValue,
}) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <h3 className="font-title-md text-sm font-bold text-on-surface">Financial Summary</h3>
        <span className="text-[11px] text-outline">Commercial Ledger</span>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span>Gross Subtotal</span>
          <span className="font-semibold text-on-surface tnum">{formatCurrency(subtotal, "INR")}</span>
        </div>

        <div className="flex items-center justify-between text-rose-600">
          <span>Commercial Discount Concession</span>
          <span className="font-semibold tnum">−{formatCurrency(discountTotal, "INR")}</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>Estimated Taxes & GST (18%)</span>
          <span className="font-semibold text-on-surface tnum">+{formatCurrency(taxTotal, "INR")}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-dashed border-slate-200">
          <div className="flex flex-col">
            <span className="font-semibold text-emerald-800">Gross Margin Estimate ({estimatedMargin}%)</span>
            <span className="text-[10px] text-slate-400">Target baseline: ≥ 25.0%</span>
          </div>
          <span className="font-bold text-emerald-700 text-sm tnum">
            {formatCurrency(marginAmount, "INR")}
          </span>
        </div>

        <div className="pt-3 border-t-2 border-[#E5E7EB] flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-on-surface">Grand Total</span>
            <p className="text-[10px] text-outline">Inclusive of all duties and discounts</p>
          </div>
          <span className="text-xl font-extrabold text-primary tnum">
            {formatCurrency(totalValue, "INR")}
          </span>
        </div>
      </div>
    </div>
  );
};
