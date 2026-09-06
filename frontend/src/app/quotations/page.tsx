import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { QuotationsListTable } from "@/components/quotations/QuotationsListTable";
import { getQuotations, SerializedQuotationListItem } from "@/lib/quotations";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Quotations | Commercial Governance",
  description: "Browse and configure enterprise commercial quotations connected to PostgreSQL",
};

interface QuotationsPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role === "CUSTOMER") {
    redirect("/portal/quotations");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  let quotations: SerializedQuotationListItem[] = [];
  let listError: string | null = null;

  try {
    quotations = await getQuotations();
  } catch (err) {
    console.error("[QuotationsPage] Error loading quotation list:", err);
    listError = "Unable to load quotations.";
  }

  const initialSearch =
    typeof resolvedParams.stage === "string"
      ? resolvedParams.stage
      : typeof resolvedParams.search === "string"
      ? resolvedParams.search
      : undefined;
  const initialStatus = typeof resolvedParams.status === "string" ? resolvedParams.status : undefined;
  const initialRisk = typeof resolvedParams.risk === "string" ? resolvedParams.risk : undefined;

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-16">
            {/* Header: Title, Subtitle & Primary Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
                  Quotations
                </h1>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  Manage, review, and create customer quotations.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/quotations/new"
                  className="h-9 px-4 rounded-lg bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-base" data-icon="add">
                    add
                  </span>
                  <span>+ Create Quotation</span>
                </Link>
              </div>
            </div>

            <QuotationsListTable
              quotations={quotations}
              error={listError}
              initialSearch={initialSearch}
              initialStatus={initialStatus}
              initialRisk={initialRisk}
            />
          </div>
        </main>
      </div>
    </>
  );
}
