import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";
import { CustomerSummary } from "@/components/CustomerSummary";
import { QuoteLineItemsTable } from "@/components/QuoteLineItemsTable";
import { RecommendationSection } from "@/components/RecommendationSection";
import { DealIntelligenceRow } from "@/components/DealIntelligenceRow";
import { QuoteActionBar } from "@/components/QuoteActionBar";

export default function QuotationBuilderPage() {
  return (
    <>
      {/* LEFT PERSISTENT SIDEBAR (260px) */}
      <AppSidebar />

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* TOP APP BAR */}
        <TopHeader />

        {/* CONTENT BODY (FULL-WIDTH WORKSPACE) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* SCROLLABLE WORKSPACE */}
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-32">
            <WorkspaceHeader />
            <CustomerSummary />
            <QuoteLineItemsTable />
            <RecommendationSection />
            <DealIntelligenceRow />
          </div>

          {/* BOTTOM ELEVATED ACTION BAR */}
          <QuoteActionBar />
        </main>
      </div>
    </>
  );
}
