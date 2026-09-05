"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export interface CustomerRow {
  id: string;
  customerNumber: string;
  name: string;
  externalAccountId?: string | null;
  industry?: string | null;
  tier: string;
  paymentTerms?: string | null;
  creditLimit: number;
  creditAvailable: number;
  territory?: string | null;
  city?: string | null;
  state?: string | null;
  activeStatus: boolean;
  quotationCount: number;
  primaryContact?: {
    name: string;
    title?: string | null;
    email: string;
  } | null;
}

interface CustomerDirectoryTableProps {
  customers: CustomerRow[];
}

export const CustomerDirectoryTable: React.FC<CustomerDirectoryTableProps> = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.externalAccountId && c.externalAccountId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.territory && c.territory.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = tierFilter === "ALL" || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F8FAFC]">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm" data-icon="search">
              search
            </span>
            <input
              type="text"
              placeholder="Search by customer name, ID, account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs text-on-surface bg-white focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs font-semibold text-on-surface bg-white shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Account Tiers</option>
            <option value="GOLD">Gold Preferred Tier</option>
            <option value="SILVER">Silver Commercial Tier</option>
            <option value="BRONZE">Bronze Standard Tier</option>
          </select>

          <Link
            href="/customers/new"
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
            <span>Register Customer</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F1F5F9] border-b border-[#E5E7EB] text-outline font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Customer ID</th>
              <th className="py-3 px-4">Enterprise Account</th>
              <th className="py-3 px-4">Tier &amp; Industry</th>
              <th className="py-3 px-4">Primary Contact</th>
              <th className="py-3 px-4">Commercial Terms</th>
              <th className="py-3 px-4 text-right">Credit Limit</th>
              <th className="py-3 px-4 text-center">Deals</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-outline">
                  No registered enterprise customers matching current criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const tierColor =
                  c.tier === "GOLD"
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : c.tier === "SILVER"
                    ? "bg-slate-100 text-slate-800 border-slate-300"
                    : "bg-orange-100 text-orange-900 border-orange-300";

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-code-tabular font-bold text-primary">
                      {c.customerNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface text-sm">{c.name}</div>
                      <div className="text-[11px] text-outline">
                        {c.externalAccountId || "Direct Account"} • {c.territory || "Domestic"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${tierColor}`}>
                        {c.tier}
                      </span>
                      <div className="text-[11px] text-outline mt-0.5">{c.industry || "Enterprise"}</div>
                    </td>
                    <td className="py-3 px-4">
                      {c.primaryContact ? (
                        <div>
                          <div className="font-semibold text-on-surface">{c.primaryContact.name}</div>
                          <div className="text-[11px] text-outline">{c.primaryContact.email}</div>
                        </div>
                      ) : (
                        <span className="text-outline italic">No contact assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-medium">
                      <div>{c.paymentTerms || "Net 30 Days"}</div>
                      <div className="text-[10px] text-outline">{c.city ? `${c.city}, ${c.state || "IN"}` : "India"}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-code-tabular font-semibold text-on-surface">
                      {formatCurrency(c.creditLimit, "INR")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {c.quotationCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/quotations/new?customerId=${c.id}`}
                        className="px-2.5 py-1 rounded border border-[#D1D5DB] hover:bg-white text-on-surface font-semibold text-[11px] inline-flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-xs" data-icon="post_add">post_add</span>
                        <span>Create Quote</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
