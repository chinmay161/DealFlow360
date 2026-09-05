"use client";

import React, { useState } from "react";

export const ReportsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState("FY 2026-27 (Q2)");

  const kpis = [
    { label: "REALIZED GROSS MARGIN", value: "34.8%", sub: "+2.4% vs target (32.4%)", positive: true, icon: "trending_up" },
    { label: "CONTRACTED REVENUE (ARR + TCV)", value: "₹9,96,20,000", sub: "13 Active Indian Enterprise Deals", positive: true, icon: "account_balance" },
    { label: "DISCOUNT LEAKAGE GOVERNANCE", value: "3.2%", sub: "-1.8% variance under threshold", positive: true, icon: "verified" },
    { label: "AVG FULFILLMENT CYCLE", value: "3.8 Days", sub: "Multi-warehouse split BlueDart SLA", positive: true, icon: "local_shipping" },
  ];

  const categoryMargins = [
    { category: "Hardware & Infrastructure", revenue: "₹3,42,00,000", cost: "₹2,32,56,000", marginPct: "32.0%", target: "30.0%", status: "On Target" },
    { category: "Cloud SaaS Subscriptions", revenue: "₹5,14,20,000", cost: "₹82,27,200", marginPct: "84.0%", target: "80.0%", status: "Exceeding" },
    { category: "Migration & Professional Services", revenue: "₹1,40,00,000", cost: "₹72,80,000", marginPct: "48.0%", target: "45.0%", status: "Exceeding" },
  ];

  const tierPerformance = [
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
      <div className="grid grid-cols-4 gap-4">
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

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-[#E5E7EB] text-outline font-semibold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-6">Product &amp; Service Category</th>
              <th className="py-3 px-4 text-right">Recognized Revenue</th>
              <th className="py-3 px-4 text-right">Delivered COGS</th>
              <th className="py-3 px-4 text-right">Gross Margin %</th>
              <th className="py-3 px-4 text-right">Target Floor</th>
              <th className="py-3 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {categoryMargins.map((cm, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60">
                <td className="py-3.5 px-6 font-semibold text-on-surface">{cm.category}</td>
                <td className="py-3.5 px-4 text-right font-code-tabular tnum font-medium text-on-surface">{cm.revenue}</td>
                <td className="py-3.5 px-4 text-right font-code-tabular tnum text-outline">{cm.cost}</td>
                <td className="py-3.5 px-4 text-right font-code-tabular tnum font-bold text-emerald-700">{cm.marginPct}</td>
                <td className="py-3.5 px-4 text-right font-code-tabular tnum text-outline">{cm.target}</td>
                <td className="py-3.5 px-6 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {cm.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Account Tier Profitability */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-title-md text-sm font-bold text-on-surface">
              Customer Account Tier Profitability &amp; Concessions
            </h3>
            <p className="text-body-sm text-xs text-outline">
              Audited performance across Indian enterprise accounts.
            </p>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-[#E5E7EB] text-outline font-semibold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-6">Account Tier</th>
              <th className="py-3 px-4 text-right">Active Accounts</th>
              <th className="py-3 px-4 text-right">Total Deal Volume</th>
              <th className="py-3 px-4 text-right">Avg. Granted Discount</th>
              <th className="py-3 px-6 text-right">Realized Gross Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {tierPerformance.map((tp, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60">
                <td className="py-3.5 px-6 font-semibold text-on-surface">{tp.tier}</td>
                <td className="py-3.5 px-4 text-right font-code-tabular tnum">{tp.accounts} enterprise accounts</td>
                <td className="py-3.5 px-4 text-right font-code-tabular tnum font-bold text-on-surface">{tp.volume}</td>
                <td className="py-3.5 px-4 text-right font-code-tabular tnum text-amber-700 font-semibold">{tp.avgDiscount}</td>
                <td className="py-3.5 px-6 text-right font-code-tabular tnum font-bold text-emerald-700">{tp.realizedMargin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
