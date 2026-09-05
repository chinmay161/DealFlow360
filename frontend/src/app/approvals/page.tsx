import { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { ApprovalsPageHeader } from "@/components/approvals/ApprovalsPageHeader";
import { ApprovalSummaryCards } from "@/components/approvals/ApprovalSummaryCards";
import { ApprovalsWorkspace } from "@/components/approvals/ApprovalsWorkspace";

export const metadata: Metadata = {
  title: "DealFlow360 - Approvals | Commercial Governance",
  description: "Review and manage deals requiring commercial approval in DealFlow360",
};

export default function ApprovalsPage() {
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
            <ApprovalsPageHeader pendingCount={12} />
            <ApprovalSummaryCards />
            <ApprovalsWorkspace />
          </div>
        </main>
      </div>
    </>
  );
}
