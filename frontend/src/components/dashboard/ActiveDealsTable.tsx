"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface DealRow {
  dealId: string;
  customer: string;
  value: string;
  riskScore: number;
  riskLabel: "Low" | "Medium" | "High";
  stage: string;
  status: string;
  statusType: "pending" | "active" | "awaiting" | "action";
  href?: string;
}

interface ActiveDealsTableProps {
  deals?: DealRow[];
}

export const ActiveDealsTable: React.FC<ActiveDealsTableProps> = ({ deals = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("all");

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.dealId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage === "all" || deal.stage.toLowerCase().includes(filterStage.toLowerCase());
    return matchesSearch && matchesStage;
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Table Header Controls */}
      <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright">
        <div className="flex items-center gap-2">
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">
            Active Commercial Deals
          </h2>
          <span className="px-2 py-0.5 text-label-sm font-semibold rounded-full bg-surface-container-high text-primary">
            {deals.length} Active Deals
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative w-48">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm" data-icon="search">
              search
            </span>
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 rounded-md bg-white border border-[#D1D5DB] text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-xs"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            aria-label="Filter deals by stage"
            className="h-8 px-2.5 rounded-md bg-white border border-[#D1D5DB] text-body-sm text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Stages</option>
            <option value="draft">Drafting</option>
            <option value="sales">Sales Review</option>
            <option value="finance">Finance Review</option>
            <option value="executive">Executive</option>
          </select>

          <Link
            href="/quotations?view=list"
            className="h-8 px-2.5 rounded-md bg-white border border-[#D1D5DB] text-on-surface font-label-md text-xs font-semibold hover:bg-surface-bright flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider">
              <th className="py-2.5 px-space-base font-semibold">Deal Reference</th>
              <th className="py-2.5 px-space-md font-semibold">Customer</th>
              <th className="py-2.5 px-space-md font-semibold text-right">Value</th>
              <th className="py-2.5 px-space-md font-semibold">Risk Level</th>
              <th className="py-2.5 px-space-md font-semibold">Current Stage</th>
              <th className="py-2.5 px-space-md font-semibold">Status</th>
              <th className="py-2.5 px-space-base font-semibold text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-outline text-body-md">
                  No deals match your search criteria.
                </td>
              </tr>
            ) : (
              filteredDeals.map((deal) => {
                const targetHref = deal.href || `/quotations/${deal.dealId}`;
                return (
                  <tr
                    key={deal.dealId}
                    className="hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                  >
                    {/* Deal Reference */}
                    <td className="py-3 px-space-base">
                      <Link
                        href={targetHref}
                        className="font-code-tabular text-body-md font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>{deal.dealId}</span>
                        <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-icon="open_in_new">
                          open_in_new
                        </span>
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-space-md font-title-md text-body-md font-medium text-on-surface">
                      {deal.customer}
                    </td>

                    {/* Value */}
                    <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                      {deal.value}
                    </td>

                    {/* Risk Level Badge */}
                    <td className="py-3 px-space-md">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          deal.riskLabel === "High"
                            ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                            : deal.riskLabel === "Medium"
                            ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                            : "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            deal.riskLabel === "High"
                              ? "bg-[#E11D48]"
                              : deal.riskLabel === "Medium"
                              ? "bg-[#D97706]"
                              : "bg-[#10B981]"
                          }`}
                        ></span>
                        <span>{deal.riskScore} · {deal.riskLabel}</span>
                      </span>
                    </td>

                    {/* Current Stage */}
                    <td className="py-3 px-space-md text-body-sm text-[#475569]">
                      {deal.stage}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-space-md">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${
                          deal.statusType === "pending"
                            ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                            : deal.statusType === "active"
                            ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]"
                            : deal.statusType === "action"
                            ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                            : "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-space-base text-center">
                      <Link
                        href={targetHref}
                        className="inline-flex items-center justify-center p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors"
                        title="Open Deal"
                      >
                        <span className="material-symbols-outlined text-base" data-icon="chevron_right">
                          chevron_right
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="p-space-sm bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between text-body-sm text-outline">
        <span>Showing {filteredDeals.length} active deals</span>
        <Link
          href="/quotations/Q-1042"
          className="text-xs text-primary font-semibold hover:underline"
        >
          Open Canonical Q-1042 &rarr;
        </Link>
      </div>
    </div>
  );
};
