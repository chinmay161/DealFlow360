import { Metadata } from "next";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { QuotationDetailView } from "@/components/quotations/QuotationDetailView";
import { getQuotationWithLineItems } from "@/lib/quotations";

export const dynamic = "force-dynamic";

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: QuotationDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `DealFlow360 - Quotation | ${decodeURIComponent(id).toUpperCase()}`,
    description: `Enterprise Commerce Quotation ${decodeURIComponent(id).toUpperCase()} connected to PostgreSQL`,
  };
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  let quotation = null;
  let errorMessage: string | null = null;

  try {
    quotation = await getQuotationWithLineItems(decodedId);
  } catch (error) {
    console.error(`[QuotationDetailPage] Error loading quotation ${decodedId}:`, error);
    errorMessage = "Unable to load quotations.";
  }

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
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
                Quotation #{decodedId} could not be found in PostgreSQL.
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
