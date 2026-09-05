import type { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { getCommercialReportData } from "@/lib/services/reportService";

export const metadata: Metadata = {
  title: "DealFlow360 - Commercial Reports & Analytics",
  description: "Executive commercial reports, profit margins, and deal performance.",
};

export const dynamic = "force-dynamic";

export default async function ReportsRoute() {
  const reportData = await getCommercialReportData();

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-32">
            <ReportsDashboard initialData={reportData} />
          </div>
        </main>
      </div>
    </>
  );
}
