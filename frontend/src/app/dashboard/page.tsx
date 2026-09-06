import { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { ActiveDealsTable } from "@/components/dashboard/ActiveDealsTable";
import { ActionRequiredPanel } from "@/components/dashboard/ActionRequiredPanel";
import { DealHealthPanel } from "@/components/dashboard/DealHealthPanel";
import { PipelinePerformance } from "@/components/dashboard/PipelinePerformance";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { getDashboardMetrics } from "@/lib/services/dashboardService";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Dashboard | Operational Command Center",
  description: "Monitor active deals, approvals, revenue, and operational activity in DealFlow360",
};

export default async function DashboardPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  if (userRole === "CUSTOMER") {
    redirect("/customer/dashboard");
  }
  if (userRole === "MANAGER") {
    redirect("/manager/dashboard");
  }

  let metrics = null;
  try {
    metrics = await getDashboardMetrics();
  } catch (err) {
    console.error("Failed to load dashboard metrics:", err);
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
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-16">
            <DashboardHeader />
            <KpiRow kpi={metrics?.kpi} />

            {/* TWO-COLUMN WORKSPACE: LEFT ~67%, RIGHT ~33% */}
            <div className="grid grid-cols-12 gap-space-base items-start">
              {/* LEFT COLUMN: ACTIVE DEALS & PIPELINE PERFORMANCE */}
              <div className="col-span-8 space-y-space-base">
                <ActiveDealsTable deals={metrics?.activeDeals} />
                <PipelinePerformance initialStages={metrics?.pipelineStages} />
              </div>

              {/* RIGHT COLUMN: ACTION REQUIRED & DEAL HEALTH */}
              <div className="col-span-4 space-y-space-base">
                <ActionRequiredPanel items={metrics?.actionRequired} />
                <DealHealthPanel dealHealth={metrics?.dealHealth} />
              </div>
            </div>

            {/* BOTTOM SECTION: RECENT ACTIVITY */}
            <RecentActivityFeed activities={metrics?.recentActivity} />
          </div>
        </main>
      </div>
    </>
  );
}
