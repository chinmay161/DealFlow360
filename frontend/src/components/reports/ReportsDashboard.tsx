"use client";

import React, { useState } from "react";
import { CommercialReportData } from "@/lib/services/reportService";

interface ReportsDashboardProps {
  initialData?: CommercialReportData;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ initialData }) => {
  const [dateRange, setDateRange] = useState("FY 2026-27 (Q2)");

  const kpis = initialData?.kpis || [
    { label: "REALIZED GROSS MARGIN", value: "34.8%", sub: "+2.4% vs target (32.4%)", positive: true, icon: "trending_up" },
    { label: "CONTRACTED REVENUE (ARR + TCV)", value: "₹9,96,20,000", sub: "13 Active Indian Enterprise Deals", positive: true, icon: "account_balance" },
    { label: "DISCOUNT LEAKAGE GOVERNANCE", value: "3.2%", sub: "-1.8% variance under threshold", positive: true, icon: "verified" },
    { label: "AVG FULFILLMENT CYCLE", value: "3.8 Days", sub: "Multi-warehouse split BlueDart SLA", positive: true, icon: "local_shipping" },
  ];

  const categoryMargins = initialData?.categoryMargins || [
    { category: "Hardware & Infrastructure", revenue: "₹3,42,00,000", cost: "₹2,32,56,000", marginPct: "32.0%", target: "30.0%", status: "On Target" },
    { category: "Cloud SaaS Subscriptions", revenue: "₹5,14,20,000", cost: "₹82,27,200", marginPct: "84.0%", target: "80.0%", status: "Exceeding" },
    { category: "Migration & Professional Services", revenue: "₹1,40,00,000", cost: "₹72,80,000", marginPct: "48.0%", target: "45.0%", status: "Exceeding" },
  ];

  const tierPerformance = initialData?.tierPerformance || [
    { tier: "Gold Preferred (Enterprise)", accounts: 3, totalDeals: 7, volume: "₹5,42,00,000", avgDiscount: "14.2%", realizedMargin: "36.4%" },
    { tier: "Silver Commercial", accounts: 1, totalDeals: 4, volume: "₹2,84,00,000", avgDiscount: "9.8%", realizedMargin: "33.2%" },
    { tier: "Bronze Emerging", accounts: 1, totalDeals: 2, volume: "₹1,70,20,000", avgDiscount: "5.5%", realizedMargin: "38.1%" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="analytics">
              analytics
            </span>
            <h1 className="font-headline-sm text-2xl font-bold text-on-surface">
              Commercial Reports &amp; Profitability
            </h1>
          </div>
          <p className="font-body-sm text-xs text-outline mt-1">
            Executive revenue analytics, lifetime margins, discount compliance, and fulfillment health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs font-semibold text-on-surface bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option>FY 2026-27 (Q2)</option>
            <option>FY 2026-27 (Q1)</option>
            <option>Full Year 2026</option>
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#D1D5DB] hover:bg-slate-50 text-xs font-semibold text-on-surface shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm" data-icon="print">
              print
            </span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
              <span className="material-symbols-outlined text-primary text-base">{kpi.icon}</span>
            </div>
            <div>
              <div className="text-xl font-bold text-on-surface font-code-tabular tnum">{kpi.value}</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Margin Breakdown Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-title-md text-sm font-bold text-on-surface">
              Margin Realization by Commercial Category
            </h3>
            <p className="text-body-sm text-xs text-outline">
              Analysis of gross margin yield versus company policy floors.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Portfolio Health: Optimal
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-slate-50/80 text-outline uppercase font-semibold text-[10px] tracking-wider">
              <th className="px-6 py-3">Category Name</th>
              <th className="px-6 py-3">Contracted Revenue</th>
              <th className="px-6 py-3">Cost of Delivery</th>
              <th className="px-6 py-3">Realized Margin</th>
              <th className="px-6 py-3">Target Margin</th>
              <th className="px-6 py-3 text-right">Policy Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {categoryMargins.map((cat, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-3.5 font-bold text-on-surface">{cat.category}</td>
                <td className="px-6 py-3.5 font-code-tabular tnum text-on-surface">{cat.revenue}</td>
                <td className="px-6 py-3.5 font-code-tabular tnum text-outline">{cat.cost}</td>
                <td className="px-6 py-3.5 font-code-tabular tnum font-bold text-emerald-600">{cat.marginPct}</td>
                <td className="px-6 py-3.5 font-code-tabular tnum text-outline">{cat.target}</td>
                <td className="px-6 py-3.5 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      cat.status === "Exceeding"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : cat.status === "On Target"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {cat.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Tier Commercial Performance */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-title-md text-sm font-bold text-on-surface">
              Commercial Tier Performance &amp; Discounting
            </h3>
            <p className="text-body-sm text-xs text-outline">
              Analysis of volume capture versus average discount leakage by customer tier.
            </p>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-slate-50/80 text-outline uppercase font-semibold text-[10px] tracking-wider">
              <th className="px-6 py-3">Customer Tier</th>
              <th className="px-6 py-3">Active Accounts</th>
              <th className="px-6 py-3">Quoted Deals</th>
              <th className="px-6 py-3">Total Volume</th>
              <th className="px-6 py-3">Avg Discount Given</th>
              <th className="px-6 py-3 text-right">Realized Gross Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {tierPerformance.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-3.5 font-bold text-on-surface flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>{row.tier}</span>
                </td>
                <td className="px-6 py-3.5 font-code-tabular tnum text-on-surface">{row.accounts}</td>
                <td className="px-6 py-3.5 font-code-tabular tnum text-on-surface">{row.totalDeals}</td>
                <td className="px-6 py-3.5 font-code-tabular tnum font-bold text-on-surface">{row.volume}</td>
                <td className="px-6 py-3.5 font-code-tabular tnum text-amber-700 font-semibold">{row.avgDiscount}</td>
                <td className="px-6 py-3.5 font-code-tabular tnum font-bold text-emerald-700 text-right">{row.realizedMargin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
