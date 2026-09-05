import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Cpu, CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { useQuoteStock } from "../hooks/useQuoteStock";
import type { StockValidationResult } from "../types/inventory.types";

interface RuleEngineInventoryStatusWidgetProps {
  quotationId?: string;
  quotationNumber?: string;
}

export const RuleEngineInventoryStatusWidget: React.FC<RuleEngineInventoryStatusWidgetProps> = ({
  quotationId,
  quotationNumber,
}) => {
  const { data, isLoading } = useQuoteStock({ quotationId: quotationId || quotationNumber });
  const items: StockValidationResult[] = (data as any)?.items || [];

  if (isLoading || items.length === 0) return null;

  const failedItems = items.filter((i) => i.status === "FAIL");
  const warnItems = items.filter((i) => i.status === "WARN");
  const isHealthy = failedItems.length === 0 && warnItems.length === 0;

  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Rule Engine Inventory Validation &amp; Counterfactual Guidance
            </CardTitle>
            <p className="text-[11px] text-slate-500">
              Automated governance rule checks on warehouse availability &amp; allocation feasibility
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            failedItems.length > 0
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : warnItems.length > 0
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {failedItems.length > 0
            ? "STOCK VALIDATION: FAILED"
            : warnItems.length > 0
            ? "STOCK VALIDATION: REVIEW REQUIRED"
            : "STOCK VALIDATION: PASSED"}
        </span>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {isHealthy ? (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              All requested quantities are fully backed by free warehouse stock. The deal satisfies policy rules for instant allocation without managerial exception routing.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {failedItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-2 text-xs text-rose-950"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>
                      Stock Validation Failed: {item.productName} ({item.sku})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-700">
                    Deficit: -{item.deficit} units
                  </span>
                </div>

                <div className="pl-6 space-y-1 text-slate-700">
                  <p>
                    <strong>Reason:</strong> Requested quantity ({item.requestedQty}) exceeds available free stock ({item.freeStock}).
                  </p>
                  <p className="text-amber-800 font-medium">
                    ⚠ Only {item.freeStock} units available. The Rule Engine may require approval or recommend quantity adjustments.
                  </p>
                </div>

                {item.counterfactualRecommendation && (
                  <div className="mt-2 p-2.5 bg-white rounded-lg border border-rose-200/60 flex items-start gap-2 text-slate-800">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-amber-700">
                        Counterfactual Engine Recommendation
                      </span>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {item.counterfactualRecommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {warnItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs text-amber-950"
              >
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Low Buffer Warning: {item.productName} ({item.sku})</span>
                </div>
                <p className="pl-6 text-slate-700">
                  {item.ruleMessage}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
