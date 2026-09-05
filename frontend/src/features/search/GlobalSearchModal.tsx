"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, FileText, Package, Building2, ArrowRight } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchModal({ open, onOpenChange }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useGlobalSearch(query);

  const results = data?.results ?? [];

  const quotations = results.filter((r) => r.type === "quotation");
  const products = results.filter((r) => r.type === "product");
  const customers = results.filter((r) => r.type === "customer");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" onClose={() => onOpenChange(false)}>
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3 bg-slate-50/50">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search quotations, products, or customers..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400 text-slate-900"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[420px] overflow-y-auto p-4 divide-y divide-slate-100">
          {isLoading && (
            <div className="py-8 text-center text-xs text-slate-400">
              Searching across records...
            </div>
          )}

          {!isLoading && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No quotations, products, or customers matched &quot;{query}&quot;
            </div>
          )}

          {!isLoading && query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search...
            </div>
          )}

          {/* Quotations Section */}
          {quotations.length > 0 && (
            <div className="pb-3 pt-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Quotations
              </div>
              <div className="space-y-1">
                {quotations.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500">{item.subtitle}</div>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {products.length > 0 && (
            <div className="py-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Products Catalog
              </div>
              <div className="space-y-1">
                {products.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500">{item.subtitle}</div>
                    </div>
                    <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Add to quote <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Customers Section */}
          {customers.length > 0 && (
            <div className="pt-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Enterprise Customers
              </div>
              <div className="space-y-1">
                {customers.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500">{item.subtitle}</div>
                    </div>
                    {item.badge && (
                      <Badge variant="outline" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
