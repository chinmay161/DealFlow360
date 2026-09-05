"use client";

import React from "react";
import Link from "next/link";

interface DealRow {
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

const deals: DealRow[] = [
  {
    dealId: "Q-1042",
    customer: "Acme Corporation",
    value: "$18,300",
    riskScore: 72,
    riskLabel: "High",
    stage: "Finance Review",
    status: "Pending Approval",
    statusType: "pending",
    href: "/",
  },
  {
    dealId: "Q-1041",
    customer: "Northstar Technologies",
    value: "$84,500",
    riskScore: 38,
    riskLabel: "Low",
    stage: "Negotiation",
    status: "Active",
    statusType: "active",
  },
  {
    dealId: "Q-1038",
    customer: "Globex Industries",
    value: "$126,000",
    riskScore: 54,
    riskLabel: "Medium",
    stage: "Sales Review",
    status: "In Progress",
    statusType: "active",
  },
  {
    dealId: "Q-1035",
    customer: "Vertex Solutions",
    value: "$42,800",
    riskScore: 22,
    riskLabel: "Low",
    stage: "Quote Sent",
    status: "Awaiting Customer",
    statusType: "awaiting",
  },
  {
    dealId: "Q-1029",
    customer: "Orion Manufacturing",
    value: "$96,400",
    riskScore: 68,
    riskLabel: "High",
    stage: "Commercial Review",
    status: "Action Required",
    statusType: "action",
  },
];

export const ActiveDealsTable: React.FC = () => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Panel Header */}
      <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">Active Deals</h2>
            <span className="px-2 py-0.5 text-label-sm font-semibold rounded-full bg-surface-container-high text-primary">
              5 Priority
            </span>
          </div>
          <p className="font-body-sm text-[11px] text-outline mt-0.5">
            Track your highest-value active opportunities.
          </p>
        </div>
        <a
          href="#"
          className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1 transition-colors"
        >
          <span>View All Deals</span>
          <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
            arrow_forward
          </span>
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider">
              <th className="py-2.5 px-space-base font-semibold">Deal</th>
              <th className="py-2.5 px-space-md font-semibold">Customer</th>
              <th className="py-2.5 px-space-md font-semibold text-right w-28">Value</th>
              <th className="py-2.5 px-space-md font-semibold w-32">Risk</th>
              <th className="py-2.5 px-space-md font-semibold w-36">Stage</th>
              <th className="py-2.5 px-space-base font-semibold w-40">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">
            {deals.map((deal) => {
              return (
                <tr key={deal.dealId} className="hover:bg-[#F8FAFC] transition-colors group">
                  {/* Deal ID */}
                  <td className="py-2.5 px-space-base">
                    {deal.href ? (
                      <Link
                        href={deal.href}
                        className="font-code-tabular text-body-md font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>{deal.dealId}</span>
                        <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-icon="open_in_new">
                          open_in_new
                        </span>
                      </Link>
                    ) : (
                      <span className="font-code-tabular text-body-md font-semibold text-on-surface">
                        {deal.dealId}
                      </span>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="py-2.5 px-space-md font-medium text-on-surface">
                    {deal.customer}
                  </td>

                  {/* Value */}
                  <td className="py-2.5 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                    {deal.value}
                  </td>

                  {/* Risk */}
                  <td className="py-2.5 px-space-md">
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
                      <span>{deal.riskScore} / {deal.riskLabel}</span>
                    </span>
                  </td>

                  {/* Stage */}
                  <td className="py-2.5 px-space-md text-body-sm text-[#475569]">
                    {deal.stage}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-space-base">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${
                        deal.statusType === "pending"
                          ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                          : deal.statusType === "active"
                          ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]"
                          : deal.statusType === "action"
                          ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                          : "bg-surface-container text-[#475569] border border-[#D1D5DB]"
                      }`}
                    >
                      {deal.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
