import type { Metadata } from "next";
import Link from "next/link";
import { getCustomerQuotations } from "@/lib/services/portalService";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "DealFlow360 - Customer Portal",
  description: "Enterprise Buyer Workspace & Proposal Collaboration Hub",
};

export const dynamic = "force-dynamic";

interface CustomerPortalPageProps {
  searchParams?: Promise<{ customer?: string }>;
}

export default async function CustomerPortalPage({ searchParams }: CustomerPortalPageProps) {
  const resolvedParams = await searchParams;
  const customerQuery = resolvedParams?.customer;

  let customer = null;
  if (customerQuery) {
    customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { name: { contains: customerQuery, mode: "insensitive" } },
          { customerNumber: customerQuery },
          { id: customerQuery },
        ],
      },
      include: { contacts: true },
    });
  }

  if (!customer) {
    customer =
      (await prisma.customer.findFirst({
        where: { quotations: { some: {} } },
        include: { contacts: true },
      })) ||
      (await prisma.customer.findFirst({
        include: { contacts: true },
      }));
  }

  const activeCustomerName = customer?.name || "Apex Infotech Pvt. Ltd.";
  const primaryContact = customer?.contacts?.find((c) => c.isPrimary) || customer?.contacts?.[0] || null;
  const contactName = primaryContact?.name || "Procurement Authority";
  const contactTitle = primaryContact?.title || "Commercial Buyer";
  const contactInitials =
    contactName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "CA";

  const quotes = await getCustomerQuotations(activeCustomerName);

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
            <span className="block text-xs font-bold text-on-surface">{activeCustomerName}</span>
            <span className="block text-[11px] text-outline">
              {contactName} ({contactTitle})
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700">
            {contactInitials}
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
                All valid quotations prepared for {activeCustomerName}.
              </p>
            </div>
            <span className="text-xs text-outline font-semibold">
              {quotes.length} Proposals Available
            </span>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {quotes.length === 0 ? (
              <div className="py-12 text-center text-outline">
                <span className="material-symbols-outlined text-4xl opacity-40 mb-2" data-icon="folder_off">
                  folder_off
                </span>
                <p className="text-body-md font-semibold text-on-surface">No Commercial Proposals Found</p>
                <p className="text-body-sm text-outline mt-1">
                  There are currently no active proposals published for this account.
                </p>
              </div>
            ) : (
              quotes.map((q) => {
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
                          className="font-title-md text-base font-bold text-primary hover:underline"
                        >
                          {q.quotationNumber}
                        </Link>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAccepted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isReview
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <p className="text-xs text-outline">
                        Created on {q.createdAt} • Valid until {q.validUntil}
                      </p>
                      <div className="flex items-center gap-2 mt-2 pt-1 text-xs text-on-surface-variant">
                        <span>{q.lineItems.length} Products Quoted</span>
                        <span>•</span>
                        <span>{q.paymentTerms}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="font-code-tabular tnum text-xl font-bold text-on-surface">
                        {formatCurrency(q.totalValue, q.currency)}
                      </div>
                      <Link
                        href={`/portal/quotations/${q.quotationNumber}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[#1E3A8A] transition-colors"
                      >
                        <span>Review &amp; Sign</span>
                        <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
