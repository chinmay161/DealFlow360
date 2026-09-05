"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Building2, Check, CreditCard } from "lucide-react";
import { quotationService } from "@/services/quotation.service";
import type { Customer } from "@/types/quotation.types";
import { Badge } from "@/components/ui/badge";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  error?: string;
}

export function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
  error,
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    quotationService
      .getCustomers(search)
      .then((data) => {
        if (active) setCustomers(data);
      })
      .catch((err) => console.error("Error fetching customers:", err))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        Customer Account <span className="text-rose-500">*</span>
      </label>

      {/* Selector Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] p-3 rounded-xl border bg-white cursor-pointer transition-all flex items-center justify-between ${
          error
            ? "border-rose-300 ring-1 ring-rose-200"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-slate-200/80 hover:border-slate-300"
        }`}
      >
        {selectedCustomer ? (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-slate-900">
                  {selectedCustomer.name}
                </span>
                <Badge variant="outline" className="text-[10px] py-0">
                  {selectedCustomer.tier} Tier
                </Badge>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                <span>{selectedCustomer.industry || "Enterprise"}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 inline text-slate-400" />
                  Available: ₹{selectedCustomer.creditAvailable.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Select or search enterprise customer...</span>
        )}

        <span className="text-xs text-blue-600 font-medium">Change</span>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-40 mt-1 w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name or industry..."
              className="w-full bg-transparent text-xs focus:outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading accounts...</div>
            ) : customers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No customer found matching &quot;{search}&quot;
              </div>
            ) : (
              customers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      setIsOpen(false);
                    }}
                    className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{c.name}</span>
                        <Badge variant="secondary" className="text-[10px] py-0">
                          {c.tier}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {c.industry || "Enterprise"} • Terms: {c.paymentTerms || "Net 30"} • Available Credit: ₹
                        {c.creditAvailable.toLocaleString()}
                      </div>
                    </div>

                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
