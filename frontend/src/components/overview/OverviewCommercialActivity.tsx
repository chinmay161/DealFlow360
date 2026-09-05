"use client";

import React from "react";
import Link from "next/link";
import { OverviewMetrics } from "@/lib/services/overviewService";

interface OverviewCommercialActivityProps {
  recentQuotations: OverviewMetrics["recentQuotations"];
  actionRequired: OverviewMetrics["actionRequired"];
}

export const OverviewCommercialActivity: React.FC<OverviewCommercialActivityProps> = ({
  recentQuotations,
  actionRequired,
}) => {
  return (
    <div className="grid grid-cols-12 gap-space-base items-stretch">
      {/* LEFT COLUMN (8 cols): RECENT QUOTATIONS */}
      <div className="col-span-8 bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-primary text-base"
                  data-icon="request_quote"
                >
                  request_quote
                </span>
                <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                  Recent Quotations
                </h2>
              </div>
              <p className="font-body-sm text-[11px] text-outline mt-0.5">
                Latest enterprise proposals · Click row to open quotation
              </p>
            </div>
            <Link
              href="/quotations"
              className="h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright flex items-center gap-1.5 transition-colors shadow-sm text-xs"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider">
                  <th className="py-2.5 px-space-base font-semibold">Quote #</th>
                  <th className="py-2.5 px-space-md font-semibold">Customer</th>
                  <th className="py-2.5 px-space-md font-semibold">Owner</th>
                  <th className="py-2.5 px-space-md font-semibold text-right">Value</th>
                  <th className="py-2.5 px-space-md font-semibold">Stage</th>
                  <th className="py-2.5 px-space-md font-semibold">Status</th>
                  <th className="py-2.5 px-space-base font-semibold text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">
                {recentQuotations.map((q) => {
                  const isHighRisk = q.riskScore >= 70;
                  const isMediumRisk = q.riskScore >= 40 && q.riskScore < 70;
                  const statusBadgeClass =
                    q.status === "Approved"
                      ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                      : q.status === "In Review"
                      ? "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]"
                      : "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]";

                  return (
                    <tr
                      key={q.dealId}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-space-base">
                        <Link
                          href={q.href}
                          className="font-code-tabular font-bold text-primary hover:underline block"
                        >
                          {q.dealId}
                        </Link>
                      </td>
                      <td className="py-3 px-space-md font-semibold text-on-surface">
                        <Link href={q.href} className="hover:text-primary transition-colors block truncate max-w-[170px]">
                          {q.customer}
                        </Link>
                      </td>
                      <td className="py-3 px-space-md text-on-surface-variant text-xs">
                        {q.owner}
                      </td>
                      <td className="py-3 px-space-md text-right font-code-tabular tnum font-semibold text-on-surface">
                        {q.value}
                      </td>
                      <td className="py-3 px-space-md text-on-surface-variant text-xs">
                        {q.stage}
                      </td>
                      <td className="py-3 px-space-md">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-label-sm font-semibold border ${statusBadgeClass}`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-space-base text-right">
                        <span
                          className={`font-code-tabular tnum font-bold text-xs ${
                            isHighRisk
                              ? "text-[#9F1239]"
                              : isMediumRisk
                              ? "text-[#92400E]"
                              : "text-[#065F46]"
                          }`}
                        >
                          {q.riskScore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-space-base py-2 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between text-body-sm text-[11px] text-outline">
          <span>Displaying latest database proposals</span>
          <Link href="/quotations" className="font-semibold text-primary hover:underline">
            Open Quotations Directory &rarr;
          </Link>
        </div>
      </div>

      {/* RIGHT COLUMN (4 cols): ACTION REQUIRED */}
      <div className="col-span-4 bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[#E11D48] text-base"
                data-icon="assignment_late"
              >
                assignment_late
              </span>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                Action Required
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
              {actionRequired.length} Critical
            </span>
          </div>

          {/* List */}
          <div className="space-y-2.5">
            {actionRequired.length === 0 ? (
              <div className="py-6 text-center text-body-sm text-outline">
                No critical items requiring immediate action.
              </div>
            ) : (
              actionRequired.slice(0, 4).map((item) => {
                const isHigh = item.priority === "HIGH" || item.priority === "URGENT";
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-md border border-[#F1F5F9] hover:border-[#E5E7EB] hover:bg-[#F8FAFC] transition-all flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={item.href}
                          className="font-code-tabular text-body-sm font-bold text-primary hover:underline"
                        >
                          {item.dealId}
                        </Link>
                        <span className="font-label-sm text-outline">•</span>
                        <span className="font-title-md text-xs font-semibold text-on-surface truncate">
                          {item.customer}
                        </span>
                      </div>
                      <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                        {item.role} · {item.assignee}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                          isHigh
                            ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                            : "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                        }`}
                      >
                        {isHigh ? "High Priority" : "Standard"}
                      </span>
                      <Link
                        href={item.href}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                      >
                        <span>Review</span>
                        <span
                          className="material-symbols-outlined text-[11px]"
                          data-icon="chevron_right"
                        >
                          chevron_right
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#F1F5F9] mt-3 flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Approval queue</span>
          <Link href="/approvals" className="font-medium text-primary hover:underline">
            Open Approvals Console &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
