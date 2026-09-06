import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomerQuotationDetail } from "@/lib/services/portalService";
import { formatCurrency } from "@/lib/currency";
import { CustomerNegotiationBox } from "@/components/portal/CustomerNegotiationBox";
import { PortalLogoutButton } from "@/components/portal/PortalLogoutButton";

interface PortalQuotationProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PortalQuotationProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `DealFlow360 - Proposal | ${id.toUpperCase()}`,
    description: `Customer Commercial Review for ${id.toUpperCase()}`,
  };
}

export default async function PortalQuotationDetailPage({ params }: PortalQuotationProps) {
  const session = await auth();

  // Server-side customer authorization
  if (!session?.user || session.user.role !== "CUSTOMER" || !session.user.customerId) {
    redirect("/portal");
  }

  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  // Authoritative query scoped strictly to the customer belonging to this authenticated session
  const quote = await getCustomerQuotationDetail(decodedId, session.user.customerId);

  // If quote does not exist or belongs to another customer, return 404 without leaking existence
  if (!quote) {
    notFound();
  }

  const isAccepted = quote.status === "ACCEPTED";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Portal Top Bar */}
      <header className="h-16 px-6 sm:px-8 bg-white border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/portal"
            className="flex items-center gap-1.5 text-xs font-semibold text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-sm" data-icon="arrow_back">
              arrow_back
            </span>
            <span>All Proposals</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-sm text-on-surface font-code-tabular">
            Proposal {quote.quotationNumber}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              isAccepted
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-blue-100 text-blue-800 border border-blue-300"
            }`}
          >
            {isAccepted ? "Accepted & Executed" : "Active Commercial Proposal"}
          </span>
          <PortalLogoutButton />
        </div>
      </header>

      {/* Main Proposal Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Proposal Header Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-6">
            <div>
              <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                Commercial Quotation
              </span>
              <h1 className="text-3xl font-bold text-on-surface mt-1 font-code-tabular">
                {quote.quotationNumber}
              </h1>
              <p className="text-xs text-outline mt-1">
                Issued to: <strong className="text-on-surface">{quote.customerName}</strong> ({quote.customerCode})
              </p>
            </div>

            <div className="sm:text-right space-y-1 text-xs text-outline">
              <div>Issue Date: <strong className="text-on-surface">{quote.createdAt}</strong></div>
              <div>Valid Until: <strong className="text-on-surface">{quote.validUntil}</strong></div>
              <div>Currency: <strong className="text-on-surface">Indian Rupee (INR / ₹)</strong></div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-[#E5E7EB] text-outline font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item &amp; Description</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {quote.lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                      {item.productName}
                    </td>
                    <td className="py-3.5 px-4 text-outline font-code-tabular">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-4 text-right font-code-tabular tnum font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-code-tabular tnum">
                      {formatCurrency(item.unitPrice, "INR")}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-700 font-semibold font-code-tabular">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-code-tabular tnum font-bold text-on-surface">
                      {formatCurrency(item.lineTotal, "INR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-outline">
                <span>Subtotal (List Price):</span>
                <span className="font-code-tabular tnum text-on-surface font-medium">
                  {formatCurrency(quote.subtotal, "INR")}
                </span>
              </div>
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Discount Allowance:</span>
                <span className="font-code-tabular tnum">
                  -{formatCurrency(quote.discountTotal, "INR")}
                </span>
              </div>
              <div className="flex justify-between text-outline">
                <span>GST (18% Goods &amp; Services Tax):</span>
                <span className="font-code-tabular tnum text-on-surface font-medium">
                  {formatCurrency(quote.taxTotal, "INR")}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E5E7EB] font-bold text-sm text-primary">
                <span>Total Payable:</span>
                <span className="font-code-tabular tnum text-base">
                  {formatCurrency(quote.totalValue, "INR")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Terms */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-xs text-xs text-on-surface-variant space-y-2">
          <h4 className="font-bold text-on-surface text-sm">Commercial &amp; Delivery Terms</h4>
          <ul className="list-disc pl-5 space-y-1 text-outline">
            <li>Payment Terms: {quote.paymentTerms}</li>
            <li>Fulfillment &amp; Multi-Warehouse Shipping: BlueDart / Delhivery Surface across Indian distribution centers.</li>
            <li>Hardware warranty includes standard 3-year manufacturer onsite support across all metros.</li>
          </ul>
        </div>

        {/* Interactive Negotiation & Acceptance Box */}
        <CustomerNegotiationBox
          quotationId={quote.id}
          quotationNumber={quote.quotationNumber}
          customerId={session.user.customerId}
          currentStatus={quote.status}
          negotiations={quote.negotiations}
          defaultSignatory={quote.primaryContact}
        />
      </main>
    </div>
  );
}
