import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import type { Quotation } from "@/types/quotation.types";

interface FinancialBreakdownCardProps {
  quotation: Quotation;
}

export function FinancialBreakdownCard({ quotation }: FinancialBreakdownCardProps) {
  const margin = Number(quotation.estimatedMargin) || 35;
  const isHealthyMargin = margin >= 25;

  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center gap-2">
        <Receipt className="h-4 w-4 text-blue-600" />
        <CardTitle className="text-sm font-semibold">Financial & Commercial Summary</CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-3 text-xs">
        <div className="flex justify-between items-center text-slate-600">
          <span>Gross Subtotal</span>
          <span className="font-mono font-medium text-slate-900">
            ₹{Number(quotation.subtotal).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span>Total Discount Concession</span>
          <span className="font-mono font-semibold text-rose-600">
            -₹{Number(quotation.discountTotal).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span>Taxes & GST (18.0%)</span>
          <span className="font-mono font-medium text-slate-900">
            +₹{Number(quotation.taxTotal).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span>Blended Commercial Margin</span>
          <span className={`font-mono font-bold ${isHealthyMargin ? "text-emerald-600" : "text-amber-600"}`}>
            {margin.toFixed(1)}% {isHealthyMargin ? "(Healthy)" : "(Review Required)"}
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900">Grand Total Value</span>
          <span className="font-mono text-xl font-extrabold text-blue-600">
            ₹{Number(quotation.totalValue).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
