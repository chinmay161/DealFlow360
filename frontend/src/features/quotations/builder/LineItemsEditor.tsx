"use client";

import React from "react";
import { Trash2, Copy, AlertTriangle, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getCurrencySymbol } from "@/lib/currency";

export interface LineItemDraft {
  id: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
}

interface LineItemsEditorProps {
  lineItems: LineItemDraft[];
  currency?: string;
  customerTierLimit?: number;
  onUpdateLineItem: (index: number, updates: Partial<LineItemDraft>) => void;
  onRemoveLineItem: (index: number) => void;
  onDuplicateLineItem: (index: number) => void;
  onOpenCatalog: () => void;
  onAddCustomItem?: () => void;
  error?: string;
}

export function LineItemsEditor({
  lineItems,
  currency = "INR",
  customerTierLimit = 15,
  onUpdateLineItem,
  onRemoveLineItem,
  onDuplicateLineItem,
  onOpenCatalog,
  onAddCustomItem,
  error,
}: LineItemsEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Quotation Line Items
          </h3>
          <p className="text-xs text-slate-500">
            Configure quantities, commercial pricing, and customer concessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenCatalog}
            className="text-xs h-8"
          >
            <PackagePlus className="h-3.5 w-3.5 mr-1" />
            Add from Catalog
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      {lineItems.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-700">No line items added yet</p>
          <p className="text-[11px] text-slate-400 mt-1 mb-3">
            Click &quot;Add from Catalog&quot; to pick products.
          </p>
          <Button type="button" size="sm" onClick={onOpenCatalog} className="text-xs">
            Browse Product Catalog
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-x-auto shadow-sm">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 text-left min-w-[180px]">Product / SKU</th>
                <th className="p-3 text-right w-24">Qty</th>
                <th className="p-3 text-right w-32">Unit Price ({getCurrencySymbol(currency)})</th>
                <th className="p-3 text-right w-28">Discount (%)</th>
                <th className="p-3 text-right w-20">Tax (%)</th>
                <th className="p-3 text-right w-32">Total ({getCurrencySymbol(currency)})</th>
                <th className="p-3 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item, idx) => {
                const sub = item.quantity * item.unitPrice;
                const disc = sub * (item.discountPercent / 100);
                const net = sub - disc;
                const exceedsCeiling = item.discountPercent > customerTierLimit;

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    {/* Product Name & SKU */}
                    <td className="p-3">
                      <Input
                        type="text"
                        value={item.productName}
                        onChange={(e) => onUpdateLineItem(idx, { productName: e.target.value })}
                        placeholder="Product title"
                        className="h-8 text-xs font-medium"
                      />
                      {item.sku && (
                        <div className="font-mono text-[10px] text-slate-400 mt-1 px-1">
                          SKU: {item.sku}
                        </div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="p-3 text-right">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateLineItem(idx, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                        }
                        className="h-8 text-xs text-right font-mono"
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="p-3 text-right">
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={item.unitPrice}
                        onChange={(e) =>
                          onUpdateLineItem(idx, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })
                        }
                        className="h-8 text-xs text-right font-mono font-semibold"
                      />
                    </td>

                    {/* Discount % */}
                    <td className="p-3 text-right">
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={item.discountPercent}
                          onChange={(e) =>
                            onUpdateLineItem(idx, {
                              discountPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                            })
                          }
                          className={`h-8 text-xs text-right font-mono ${
                            exceedsCeiling ? "border-amber-400 text-amber-700 bg-amber-50/50" : ""
                          }`}
                        />
                      </div>
                      {exceedsCeiling && (
                        <div className="text-[10px] text-amber-600 mt-1 flex items-center justify-end gap-1 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Exceeds {customerTierLimit}%
                        </div>
                      )}
                    </td>

                    {/* Tax % */}
                    <td className="p-3 text-right font-mono text-slate-500">
                      {item.taxRate}%
                    </td>

                    {/* Line Total */}
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      ₹{Math.round(net).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDuplicateLineItem(idx)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                          title="Duplicate line"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveLineItem(idx)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          title="Remove line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
