"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/RiskBadge";
import { FileDown, Send, ShieldCheck, AlertCircle } from "lucide-react";

interface FinancialSummarySidebarProps {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  marginPercent: number;
  estimatedRiskScore: number;
  isSubmitting?: boolean;
  lineItemCount?: number;
  onSaveDraft: () => void;
  onSubmitForApproval: () => void;
}

export function FinancialSummarySidebar({
  subtotal,
  discountTotal,
  taxTotal,
  grandTotal,
  marginPercent,
  estimatedRiskScore,
  isSubmitting = false,
  lineItemCount,
  onSaveDraft,
  onSubmitForApproval,
}: FinancialSummarySidebarProps) {
  const isHealthyMargin = marginPercent >= 25;
  const isLowRisk = estimatedRiskScore <= 30;
  const hasLineItems = lineItemCount !== undefined ? lineItemCount > 0 : true;

  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm sticky top-20">
      <CardHeader className="border-b border-slate-100 pb-3">
        <CardTitle className="text-sm font-semibold">Financial & Risk Summary</CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-xs">
        {/* Financial Breakdown Rows */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-slate-600">
            <span>Subtotal (Gross)</span>
            <span className="font-mono font-semibold text-slate-900">
              ₹{Math.round(subtotal).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Commercial Discount</span>
            <span className="font-mono font-semibold text-rose-600">
              -₹{Math.round(discountTotal).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>GST / Taxes (18%)</span>
            <span className="font-mono font-semibold text-slate-900">
              +₹{Math.round(taxTotal).toLocaleString()}
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900">Grand Total</span>
            <span className="font-mono text-lg font-extrabold text-blue-600">
              ₹{Math.round(grandTotal).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Commercial Governance Indicators */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Commercial Margin</span>
            <span
              className={`font-semibold font-mono ${
                isHealthyMargin ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {marginPercent.toFixed(1)}% {isHealthyMargin ? "✓" : "⚠"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Estimated Risk</span>
            <RiskBadge score={estimatedRiskScore} />
          </div>

          <div className="pt-1 text-[11px] text-slate-400 leading-tight">
            {isLowRisk ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Eligible for Fast-Track Auto Approval
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Will require Sales Manager review
              </span>
            )}
          </div>
        </div>

        {/* Validation Warning for Zero Line Items */}
        {!hasLineItems && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 flex items-start gap-2 text-xs text-amber-800 font-medium">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Add at least one product before creating a quotation.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <Button
            type="button"
            variant="primary"
            className="w-full h-10 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            isLoading={isSubmitting}
            disabled={isSubmitting || !hasLineItems}
            title={!hasLineItems ? "Add at least one product before creating a quotation." : undefined}
            onClick={onSubmitForApproval}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Submit for Approval
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-9 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !hasLineItems}
            title={!hasLineItems ? "Add at least one product before creating a quotation." : undefined}
            onClick={onSaveDraft}
          >
            <FileDown className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Save Draft
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
