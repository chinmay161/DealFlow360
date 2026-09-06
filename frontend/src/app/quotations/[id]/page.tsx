import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { QuotationDetailView } from "@/components/quotations/QuotationDetailView";
import { getQuotationWithLineItems } from "@/lib/quotations";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: QuotationDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  return {
    title: `DealFlow360 - Quotation | ${decodedId.toUpperCase()}`,
    description: `Enterprise Commerce Quotation ${decodedId.toUpperCase()} connected to PostgreSQL`,
  };
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const currentUser = await getCurrentUser();
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  if (currentUser?.role === "CUSTOMER") {
    redirect(`/portal/quotations/${decodedId}`);
  }

  let quotation = null;
  let errorMessage: string | null = null;

  try {
    quotation = await getQuotationWithLineItems(decodedId);
  } catch (error) {
    console.error(`[QuotationDetailPage] Error loading quotation ${decodedId}:`, error);
    errorMessage = "Unable to load quotation details.";
  }

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        {!quotation || errorMessage ? (
          <main className="flex-1 flex flex-col items-center justify-center bg-background p-8">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 max-w-md w-full text-center shadow-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-container-high flex items-center justify-center mb-3 text-outline">
                <span
                  className="material-symbols-outlined text-2xl"
                  data-icon="search_off"
                >
                  search_off
                </span>
              </div>
              <h2 className="text-title-md font-semibold text-on-surface">
                {errorMessage || "Quotation Not Found"}
              </h2>
              <p className="text-body-sm text-outline mt-1 mb-6">
                The requested quotation record <code className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-code-tabular text-xs">{decodedId}</code> could not be found in PostgreSQL.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/quotations"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-[#1E3A8A] text-white font-label-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm" data-icon="arrow_back">
                    arrow_back
                  </span>
                  <span>Back to Quotations</span>
                </Link>
                <Link
                  href="/quotations/new"
                  className="px-4 py-2 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] text-on-surface font-label-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm" data-icon="add">
                    add
                  </span>
                  <span>New Quotation</span>
                </Link>
              </div>
            </div>
          </main>
        ) : (
          <QuotationDetailView quotation={quotation} />
        )}
      </div>
    </>
  );
}
