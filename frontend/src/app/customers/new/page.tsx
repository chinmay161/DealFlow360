import { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { CreateCustomerForm } from "@/components/customers/CreateCustomerForm";
import { getNextCustomerNumber } from "@/lib/actions/customerActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - New Customer",
  description: "Register a new enterprise customer in DealFlow360",
};

export default async function NewCustomerPage() {
  const nextCustomerNumber = await getNextCustomerNumber();

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base">
            <CreateCustomerForm initialCustomerNumber={nextCustomerNumber} />
          </div>
        </main>
      </div>
    </>
  );
}
