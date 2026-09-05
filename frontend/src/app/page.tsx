import { Metadata } from "next";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { QuotationDetailView } from "@/components/quotations/QuotationDetailView";
import { getQuotationByNumber } from "@/lib/quotations";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Quotations | Q-1042",
  description: "Enterprise Commerce Quotation Builder connected to PostgreSQL",
};

export default async function QuotationBuilderPage() {
  const session = await auth();
  if ((session?.user as any)?.role === "CUSTOMER") {
    redirect("/customer/dashboard");
  }

  let quotation = null;
  let errorMessage: string | null = null;

  try {
    quotation = await getQuotationByNumber("Q-1042");
  } catch (error) {
    console.error("[QuotationBuilderPage] Error loading canonical Q-1042:", error);
    errorMessage = "Unable to load quotations.";
  }

  return (
    <>
      {/* LEFT PERSISTENT SIDEBAR (260px) */}
      <AppSidebar />

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* TOP APP BAR */}
        <TopHeader />

        {/* CONTENT BODY */}
        {!quotation || errorMessage ? (
          <main className="flex-1 flex flex-col items-center justify-center bg-background p-8">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 max-w-md text-center shadow-sm">
              <span
                className="material-symbols-outlined text-4xl text-outline mb-2"
                data-icon="request_quote"
              >
                request_quote
              </span>
              <h2 className="text-title-md font-semibold text-on-surface">
                {errorMessage || "No quotations found."}
              </h2>
              <p className="text-body-sm text-outline mt-1 mb-4">
                Canonical quotation Q-1042 could not be loaded from PostgreSQL.
              </p>
              <Link
                href="/quotations?view=list"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Browse All Quotations Directory →
              </Link>
            </div>
          </main>
        ) : (
          <QuotationDetailView quotation={quotation} />
        )}
      </div>
    </>
  );
}
