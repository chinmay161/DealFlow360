"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Package } from "lucide-react";
import { quotationService } from "@/services/quotation.service";
import type { Product } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCatalogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (product: Product) => void;
}

export function ProductCatalogModal({
  open,
  onOpenChange,
  onAddProduct,
}: ProductCatalogModalProps) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      quotationService
        .getProducts(search)
        .then(setProducts)
        .catch((err) => console.error("Error loading products:", err))
        .finally(() => setIsLoading(false));
    }
  }, [open, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" onClose={() => onOpenChange(false)}>
        <DialogHeader className="p-4 border-b border-slate-100 bg-slate-50/50 mb-0">
          <DialogTitle>Search Product Catalog</DialogTitle>
          <DialogDescription>
            Select products to append as dynamic line items to this quotation.
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, product name, or description..."
            className="w-full text-xs focus:outline-none placeholder:text-slate-400"
            autoFocus
          />
        </div>

        {/* Products List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-2">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading catalog items...</div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No products found matching &quot;{search}&quot;
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-500 mt-0.5">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{p.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0 font-mono">
                        {p.sku}
                      </Badge>
                    </div>
                    {p.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-md line-clamp-1">
                        {p.description}
                      </p>
                    )}
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        ₹{p.unitPrice.toLocaleString()} / {p.unit}
                      </span>
                      <span>•</span>
                      <span>GST: {p.taxRate}%</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onAddProduct(p);
                    onOpenChange(false);
                  }}
                  className="text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
