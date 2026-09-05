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

export const metadata: Metadata = {
  title: "DealFlow360 - Dashboard | Operational Command Center",
  description: "Monitor active deals, approvals, revenue, and operational activity in DealFlow360",
};

export default function DashboardPage() {
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
            <KpiRow />

            {/* TWO-COLUMN WORKSPACE: LEFT ~67%, RIGHT ~33% */}
            <div className="grid grid-cols-12 gap-space-base items-start">
              {/* LEFT COLUMN: ACTIVE DEALS & PIPELINE PERFORMANCE */}
              <div className="col-span-8 space-y-space-base">
                <ActiveDealsTable />
                <PipelinePerformance />
              </div>

              {/* RIGHT COLUMN: ACTION REQUIRED & DEAL HEALTH */}
              <div className="col-span-4 space-y-space-base">
                <ActionRequiredPanel />
                <DealHealthPanel />
              </div>
            </div>

            {/* BOTTOM SECTION: RECENT ACTIVITY */}
            <RecentActivityFeed />
          </div>
        </main>
      </div>
    </>
  );
}
