import { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { OverviewHeader } from "@/components/overview/OverviewHeader";
import { OverviewKpiRow } from "@/components/overview/OverviewKpiRow";
import { OverviewSalesSnapshot } from "@/components/overview/OverviewSalesSnapshot";
import { OverviewCommercialActivity } from "@/components/overview/OverviewCommercialActivity";
import { OverviewOperationalSnapshot } from "@/components/overview/OverviewOperationalSnapshot";
import { OverviewActivityFeed } from "@/components/overview/OverviewActivityFeed";
import { getOverviewMetrics } from "@/lib/services/overviewService";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Overview | Executive Command Center",
  description: "Your complete view of sales performance, commercial activity, and operational health.",
};

export default async function OverviewPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  if (userRole === "CUSTOMER") {
    redirect("/customer/dashboard");
  }
  if (userRole === "MANAGER") {
    redirect("/manager/dashboard");
  }

  let metrics = null;
  let errorMessage: string | null = null;

  try {
    metrics = await getOverviewMetrics();
  } catch (err) {
    console.error("[OverviewPage] Error loading overview metrics:", err);
    errorMessage = "Failed to load real-time overview metrics.";
  }

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
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-20 max-w-[1440px] w-full mx-auto">
            {errorMessage && (
              <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-lg text-body-sm text-[#9F1239]">
                {errorMessage}
              </div>
            )}

            {/* HEADER */}
            <OverviewHeader />

            {metrics && (
              <>
                {/* ROW 1 — EXECUTIVE KPI CARDS */}
                <OverviewKpiRow kpi={metrics.kpi} />

                {/* ROW 2 — SALES SNAPSHOT */}
                <OverviewSalesSnapshot
                  pipelineByStage={metrics.pipelineByStage}
                  dealHealth={metrics.dealHealth}
                />

                {/* ROW 3 — RECENT COMMERCIAL ACTIVITY */}
                <OverviewCommercialActivity
                  recentQuotations={metrics.recentQuotations}
                  actionRequired={metrics.actionRequired}
                />

                {/* ROW 4 — OPERATIONAL SNAPSHOT */}
                <OverviewOperationalSnapshot operational={metrics.operational} />

                {/* BOTTOM — RECENT ACTIVITY AUDIT TRAIL */}
                <OverviewActivityFeed activities={metrics.recentActivity} />
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
