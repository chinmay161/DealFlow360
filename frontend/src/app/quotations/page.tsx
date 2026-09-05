import { Metadata } from "next";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { QuotationDetailView } from "@/components/quotations/QuotationDetailView";
import { QuotationsListTable } from "@/components/quotations/QuotationsListTable";
import { getQuotations, getQuotationWithLineItems, SerializedQuotationListItem } from "@/lib/quotations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Quotations | Commercial Governance",
  description: "Browse and configure enterprise commercial quotations connected to PostgreSQL",
};

interface QuotationsPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const viewMode = resolvedParams.view;
  const quoteId = resolvedParams.id;

  // View Mode: Explicit List View
  if (viewMode === "list") {
    let quotations: SerializedQuotationListItem[] = [];
    let listError: string | null = null;

    try {
      quotations = await getQuotations();
    } catch (err) {
      console.error("[QuotationsPage] Error loading quotation list:", err);
      listError = "Unable to load quotations.";
    }

    return (
      <>
        <AppSidebar />
        <div className="flex-1 h-screen flex flex-col overflow-hidden">
          <TopHeader />
          <main className="flex-1 flex flex-col overflow-hidden bg-background">
            <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-16">
              {/* Breadcrumb & Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
                  <Link href="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                  <span className="material-symbols-outlined text-xs" data-icon="chevron_right">
                    chevron_right
                  </span>
                  <span className="text-primary font-semibold">Quotations</span>
                </div>
                <Link
                  href="/quotations/Q-1042"
                  className="h-8 px-3 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm" data-icon="edit_document">
                    edit_document
                  </span>
                  <span>Open Q-1042 Builder</span>
                </Link>
              </div>

              <QuotationsListTable quotations={quotations} error={listError} />
            </div>
          </main>
        </div>
      </>
    );
  }

  // Default: Quotation Detail / Builder View (Target: Q-1042 or specified id)
  const targetNumber = typeof quoteId === "string" && quoteId ? quoteId : "Q-1042";
  let quotation = null;
  let detailError: string | null = null;

  try {
    quotation = await getQuotationWithLineItems(targetNumber);
  } catch (err) {
    console.error(`[QuotationsPage] Error loading quotation ${targetNumber}:`, err);
    detailError = "Unable to load quotations.";
  }

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        {!quotation || detailError ? (
          <main className="flex-1 flex flex-col items-center justify-center bg-background p-8">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 max-w-md text-center shadow-sm">
              <span
                className="material-symbols-outlined text-4xl text-outline mb-2"
                data-icon="request_quote"
              >
                request_quote
              </span>
              <h2 className="text-title-md font-semibold text-on-surface">
                {detailError || "No quotations found."}
              </h2>
              <p className="text-body-sm text-outline mt-1 mb-4">
                Quotation #{targetNumber} could not be loaded from PostgreSQL.
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
