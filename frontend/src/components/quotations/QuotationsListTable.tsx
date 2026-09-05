"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SerializedQuotationListItem } from "@/lib/quotations";
import { createNewQuotationAction } from "@/lib/actions/quoteActions";
import { formatCurrency } from "@/lib/currency";

interface QuotationsListTableProps {
  quotations: SerializedQuotationListItem[];
  error?: string | null;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export const QuotationsListTable: React.FC<QuotationsListTableProps> = ({
  quotations,
  error,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateQuotation = async () => {
    setIsCreating(true);
    try {
      const res = await createNewQuotationAction();
      if (res.quotationNumber) {
        router.push(`/quotations/${res.quotationNumber}`);
      }
    } catch (err) {
      console.error("Failed to create quotation:", err);
      setIsCreating(false);
    }
  };

  if (error) {
    return (
      <div className="bg-white border border-[#FECDD3] rounded-lg p-12 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-2xl" data-icon="error_outline">
            error_outline
          </span>
        </div>
        <h3 className="font-title-md text-title-md font-semibold text-on-surface">
          Unable to load quotations.
        </h3>
        <p className="font-body-sm text-outline mt-1 max-w-md mx-auto">
          Please verify database connectivity and try again.
        </p>
      </div>
    );
  }

  const filtered = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.owner.name && q.owner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.customer.externalAccountId &&
        q.customer.externalAccountId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || q.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Table Header Controls */}
      <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-bright">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">
              Quotations Directory
            </h2>
            <span className="px-2 py-0.5 text-label-sm font-semibold rounded-full bg-surface-container-high text-primary">
              {quotations.length} Active Records
            </span>
          </div>
          <p className="font-body-sm text-[11px] text-outline mt-0.5">
            Real-time commercial quotations queried directly from PostgreSQL.
          </p>
        </div>

        {/* Search & Filter Bar & Action */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span
              className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm"
              data-icon="search"
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search by quote, account, owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-md bg-white border border-[#D1D5DB] text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter quotations by status"
            className="h-8 px-2.5 rounded-md bg-white border border-[#D1D5DB] text-body-sm text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="DRAFT">Draft</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            type="button"
            disabled={isCreating}
            onClick={handleCreateQuotation}
            className="h-8 px-3 rounded-md bg-primary hover:bg-[#1E3A8A] text-white font-label-md text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm" data-icon="add">
              add
            </span>
            <span>{isCreating ? "Creating..." : "New Quote"}</span>
          </button>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider">
              <th className="py-2.5 px-space-base font-semibold">Quotation #</th>
              <th className="py-2.5 px-space-md font-semibold">Customer &amp; Account</th>
              <th className="py-2.5 px-space-md font-semibold">Owner</th>
              <th className="py-2.5 px-space-md font-semibold text-right">Total Value</th>
              <th className="py-2.5 px-space-md font-semibold">Risk Score</th>
              <th className="py-2.5 px-space-md font-semibold">Stage</th>
              <th className="py-2.5 px-space-md font-semibold">Status</th>
              <th className="py-2.5 px-space-base font-semibold text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-outline text-body-md">
                  No quotations found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((q) => {
                const risk = q.riskScore ?? 0;
                const isHighRisk = risk >= 70;
                const isMediumRisk = risk >= 40 && risk < 70;
                const riskLabel = isHighRisk ? "High" : isMediumRisk ? "Medium" : "Low";

                const isReview = q.status === "IN_REVIEW";
                const isApproved = q.status === "APPROVED";
                const isDraft = q.status === "DRAFT";

                return (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/quotations/${q.quotationNumber}`)}
                    className="hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                  >
                    {/* Quotation Number Link */}
                    <td className="py-3 px-space-base">
                      <Link
                        href={`/quotations/${q.quotationNumber}`}
                        className="font-code-tabular text-body-md font-semibold text-primary hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>{q.quotationNumber}</span>
                        <span
                          className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          data-icon="open_in_new"
                        >
                          open_in_new
                        </span>
                      </Link>
                      <span className="font-body-sm text-[11px] text-outline block">
                        {q.lineItemCount} {q.lineItemCount === 1 ? "item" : "items"}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-space-md">
                      <div className="font-title-md text-body-md font-semibold text-on-surface">
                        {q.customer.name}
                      </div>
                      <div className="font-body-sm text-[11px] text-outline">
                        {q.customer.industry || "Commercial Account"}{" "}
                        {q.customer.externalAccountId ? `• ${q.customer.externalAccountId}` : ""}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-space-md">
                      <div className="font-body-md text-body-md font-medium text-on-surface">
                        {q.owner.name || q.owner.email.split("@")[0]}
                      </div>
                      <div className="font-body-sm text-[11px] text-outline truncate max-w-[160px]">
                        {q.owner.email}
                      </div>
                    </td>

                    {/* Total Value */}
                    <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                      {formatCurrency(q.totalValue, q.currency)}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-space-md">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isHighRisk
                            ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                            : isMediumRisk
                            ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                            : "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHighRisk
                              ? "bg-[#E11D48]"
                              : isMediumRisk
                              ? "bg-[#D97706]"
                              : "bg-[#10B981]"
                          }`}
                        ></span>
                        <span>
                          {risk} / {riskLabel}
                        </span>
                      </span>
                    </td>

                    {/* Stage */}
                    <td className="py-3 px-space-md text-body-sm text-[#475569]">
                      {q.currentStage || "Drafting"}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-space-md">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${
                          isReview
                            ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                            : isApproved
                            ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                            : isDraft
                            ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]"
                            : "bg-surface-container text-[#475569] border border-[#D1D5DB]"
                        }`}
                      >
                        {isReview ? "In Review" : isApproved ? "Approved" : isDraft ? "Draft" : q.status}
                      </span>
                    </td>

                    {/* Updated At */}
                    <td className="py-3 px-space-base text-right font-code-tabular text-[11px] text-outline">
                      {formatDate(q.updatedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-space-sm bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between text-body-sm text-outline">
        <span>
          Showing <strong>{filtered.length}</strong> of <strong>{quotations.length}</strong> total quotations
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/quotations/Q-1042"
            className="text-xs text-primary font-semibold hover:underline"
          >
            Open Canonical Q-1042 →
          </Link>
        </div>
      </div>
    </div>
  );
};
