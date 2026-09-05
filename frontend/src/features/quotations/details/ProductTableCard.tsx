"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Save } from "lucide-react";
import type { QuoteLineItem } from "@/types/quotation.types";
import { quotationService } from "@/services/quotation.service";
import { useToast } from "@/components/providers/ToastProvider";
import { getCurrencySymbol } from "@/lib/currency";

interface ProductTableCardProps {
  quotationId: string;
  lineItems: QuoteLineItem[];
  isDraft: boolean;
  onRefresh: () => void;
  currency?: string;
}

export function ProductTableCard({
  quotationId,
  lineItems,
  isDraft,
  onRefresh,
  currency = "INR",
}: ProductTableCardProps) {
  const toast = useToast();
  const [items, setItems] = useState<QuoteLineItem[]>(lineItems);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleUpdate = (index: number, field: keyof QuoteLineItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    setHasChanges(true);
  };

  const handleSaveDraftChanges = async () => {
    try {
      setIsSaving(true);
      await quotationService.updateQuotation(quotationId, {
        lineItems: items.map((it) => ({
          productId: it.productId || undefined,
          productName: it.productName,
          sku: it.sku || undefined,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
        })),
      });
      toast.success("Changes saved", "Quotation line items updated successfully");
      setHasChanges(false);
      onRefresh();
    } catch {
      toast.error("Save failed", "Unable to update line items");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm font-semibold">Commercial Products & Line Items</CardTitle>
          {isDraft && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              Editable (Draft Mode)
            </Badge>
          )}
        </div>

        {isDraft && hasChanges && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveDraftChanges}
            isLoading={isSaving}
            className="text-xs h-8"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Changes
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-3.5 text-left">Product Title & SKU</th>
              <th className="p-3.5 text-right w-24">Qty</th>
              <th className="p-3.5 text-right w-32">Unit Price ({getCurrencySymbol(currency)})</th>
              <th className="p-3.5 text-right w-28">Discount (%)</th>
              <th className="p-3.5 text-right w-24">Margin (%)</th>
              <th className="p-3.5 text-right w-32">Total ({getCurrencySymbol(currency)})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const sub = item.quantity * item.unitPrice;
              const disc = sub * (item.discountPercent / 100);
              const net = sub - disc;
              const margin = item.estimatedMarginPercent ?? 35;

              return (
                <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                  {/* Title & SKU */}
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.productName}
                    </div>
                    {item.sku && (
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        SKU: {item.sku}
                      </div>
                    )}
                  </td>

                  {/* Qty */}
                  <td className="p-3.5 text-right">
                    {isDraft ? (
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdate(idx, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="h-7 text-xs text-right font-mono w-20 ml-auto"
                      />
                    ) : (
                      <span className="font-mono font-medium">{item.quantity}</span>
                    )}
                  </td>

                  {/* Unit Price */}
                  <td className="p-3.5 text-right font-mono font-medium text-slate-700">
                    ₹{item.unitPrice.toLocaleString()}
                  </td>

                  {/* Discount */}
                  <td className="p-3.5 text-right">
                    {isDraft ? (
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountPercent}
                        onChange={(e) =>
                          handleUpdate(idx, "discountPercent", Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                        }
                        className="h-7 text-xs text-right font-mono w-20 ml-auto"
                      />
                    ) : (
                      <span
                        className={`font-mono font-semibold ${
                          item.discountPercent > 15 ? "text-amber-600" : "text-slate-700"
                        }`}
                      >
                        {item.discountPercent}%
                      </span>
                    )}
                  </td>

                  {/* Margin */}
                  <td className="p-3.5 text-right font-mono">
                    <span className={margin >= 25 ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                      {margin.toFixed(1)}%
                    </span>
                  </td>

                  {/* Total */}
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{Math.round(net).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
