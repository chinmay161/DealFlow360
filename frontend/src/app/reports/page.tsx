import type { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export const metadata: Metadata = {
  title: "DealFlow360 - Commercial Reports & Analytics",
  description: "Executive commercial reports, profit margins, and deal performance.",
};

export const dynamic = "force-dynamic";

export default function ReportsRoute() {
  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-32">
            <ReportsDashboard />
          </div>
        </main>
      </div>
    </>
  );
}
