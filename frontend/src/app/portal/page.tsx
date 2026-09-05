import type { Metadata } from "next";
import Link from "next/link";
import { getCustomerQuotations } from "@/lib/services/portalService";
import { formatCurrency } from "@/lib/currency";

export const metadata: Metadata = {
  title: "DealFlow360 - Customer Portal",
  description: "Enterprise Buyer Workspace & Proposal Collaboration Hub",
};

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage() {
  const quotes = await getCustomerQuotations("Apex Infotech Pvt. Ltd.");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Customer Portal Navigation Header */}
      <header className="h-16 px-8 bg-white border-b border-[#E5E7EB] flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
            DF
          </div>
          <div>
            <span className="font-bold text-sm text-on-surface">DealFlow360</span>
            <span className="text-xs text-outline ml-2 px-2 py-0.5 rounded bg-slate-100 font-medium">
              Enterprise Customer Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-xs font-bold text-on-surface">Apex Infotech Pvt. Ltd.</span>
            <span className="block text-[11px] text-outline">Ananya Shah (VP Procurement)</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700">
            AS
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-2xl p-8 text-white shadow-md flex items-center justify-between">
          <div className="space-y-2 max-w-xl">
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs inline-block">
              Commercial Proposal Review
            </span>
            <h1 className="text-2xl font-bold">
              Welcome to Your Procurement Portal
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Review your enterprise pricing, propose commercial adjustments, and securely sign commercial agreements directly with DealFlow360.
            </p>
          </div>
          <div className="hidden sm:block">
            <Link
              href={`/portal/quotations/${quotes[0]?.quotationNumber || "Q-1042"}`}
              className="px-5 py-3 rounded-xl bg-white text-primary font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <span>View Latest Proposal ({quotes[0]?.quotationNumber || "Q-1042"})</span>
              <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="font-title-md text-base font-bold text-on-surface">
                Active Commercial Proposals
              </h2>
              <p className="text-body-sm text-xs text-outline">
                All valid quotations prepared for Apex Infotech Pvt. Ltd.
              </p>
            </div>
            <span className="text-xs text-outline font-semibold">
              {quotes.length} Proposals Available
            </span>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {quotes.map((q) => {
              const isAccepted = q.status === "ACCEPTED";
              const isReview = q.status === "IN_REVIEW";

              return (
                <div
                  key={q.id}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/portal/quotations/${q.quotationNumber}`}
                        className="font-bold text-primary hover:underline text-sm font-code-tabular"
                      >
                        {q.quotationNumber}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isReview
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}
                      >
                        {isAccepted ? "Signed / Accepted" : isReview ? "Under Review" : "Ready for Review"}
                      </span>
                    </div>

                    <div className="text-xs text-outline flex items-center gap-4">
                      <span>Created: {q.createdAt}</span>
                      <span>Valid until: {q.validUntil}</span>
                      <span>Terms: {q.paymentTerms}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="block text-[11px] text-outline uppercase font-semibold">
                        Proposal Value
                      </span>
                      <span className="font-metric-display text-base font-bold text-on-surface tnum">
                        {formatCurrency(q.totalValue, "INR")}
                      </span>
                    </div>

                    <Link
                      href={`/portal/quotations/${q.quotationNumber}`}
                      className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-on-surface hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Review Details</span>
                      <span className="material-symbols-outlined text-xs" data-icon="chevron_right">
                        chevron_right
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
