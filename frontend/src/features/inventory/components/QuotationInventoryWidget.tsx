import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Boxes, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuoteStock } from "../hooks/useQuoteStock";
import type { StockValidationResult } from "../types/inventory.types";

interface QuotationInventoryWidgetProps {
  quotationId?: string;
  quotationNumber?: string;
  lineItems?: Array<{
    id: string;
    productName: string;
    sku?: string | null;
    quantity: number;
    productId?: string | null;
  }>;
}

export const QuotationInventoryWidget: React.FC<QuotationInventoryWidgetProps> = ({
  quotationId,
  quotationNumber,
}) => {
  const { data, isLoading } = useQuoteStock({ quotationId: quotationId || quotationNumber });

  const items: StockValidationResult[] = (data as any)?.items || [];

  if (isLoading) {
    return (
      <Card className="p-4 rounded-xl border border-slate-200/80 bg-white animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-3" />
        <div className="h-16 w-full bg-slate-100 rounded" />
      </Card>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const allPassed = items.every((i) => i.status === "PASS");
  const hasDeficit = items.some((i) => i.status === "FAIL");

  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Live Quotation Inventory &amp; Availability
            </CardTitle>
            <p className="text-[11px] text-slate-500">
              Real-time regional stock checks across Mumbai, Bengaluru, and Delhi NCR hubs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasDeficit ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Stock Shortage Detected
            </span>
          ) : allPassed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Line Items Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock Warnings
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700">{item.sku}</span>
                    <span className="text-xs font-semibold text-slate-900">{item.productName}</span>
                    <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Req: {item.requestedQty} units
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Available</span>
                    <span className="font-mono font-bold text-slate-800">{item.availableQty}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Reserved</span>
                    <span className="font-mono font-bold text-blue-700">{item.reservedQty}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Free Stock</span>
                    <span className={`font-mono font-bold ${item.deficit > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {item.freeStock}
                    </span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      item.status === "PASS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : item.status === "WARN"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {item.status === "PASS" ? "Ready" : item.status === "WARN" ? "Low Buffer" : "Deficit"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warehouse Split Pills */}
              {item.warehouseAllocations && item.warehouseAllocations.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                    <Building2 className="w-3 h-3" />
                    Hub Split:
                  </span>
                  {item.warehouseAllocations.map((wh) => (
                    <span
                      key={wh.warehouseId}
                      className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono"
                    >
                      {wh.warehouseName}: <strong className="text-slate-800">{wh.available} avail</strong> ({wh.reserved} res)
                    </span>
                  ))}
                </div>
              )}

              {/* Rule & Counterfactual Warning */}
              {item.deficit > 0 && (
                <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>⚠ Only {item.freeStock} units available for immediate fulfillment.</span>
                  </div>
                  <div className="text-[11px] opacity-90 pl-5">
                    {item.counterfactualRecommendation}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
