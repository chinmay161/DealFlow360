import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { CreateQuotationForm } from "@/components/quotations/CreateQuotationForm";
import { getCurrentUser } from "@/lib/auth";
import { getAuthoritativeCustomerForSession } from "@/lib/services/portalAuthService";
import {
  getCustomerById,
  getCustomerSelectorListAction,
  CompleteCustomerProfile,
  CustomerSelectorItem,
} from "@/lib/actions/customerActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Create Quotation",
  description: "Create a new customer quotation in DealFlow360",
};

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewQuotationPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  const isCustomerRole = currentUser?.role === "CUSTOMER";

  let customerList: CustomerSelectorItem[] = [];
  let initialCustomer: CompleteCustomerProfile | null = null;

  if (isCustomerRole) {
    // Authenticated CUSTOMER user:
    // Organization MUST come from session / Contact in PostgreSQL.
    // Customer CANNOT select, search, change, or enumerate organizations.
    const authCustomer = await getAuthoritativeCustomerForSession(currentUser);
    if (!authCustomer) {
      redirect("/portal?error=CustomerProfileNotFound");
    }
    initialCustomer = await getCustomerById(authCustomer.id);
    customerList = []; // Zero other organizations exposed to client
  } else {
    // Internal sales rep / employee flow
    const resolvedParams = searchParams ? await searchParams : {};
    const customerIdParam = typeof resolvedParams.customerId === "string" ? resolvedParams.customerId : undefined;

    try {
      customerList = await getCustomerSelectorListAction();
      if (customerIdParam) {
        initialCustomer = await getCustomerById(customerIdParam);
      }
    } catch (err) {
      console.error("[NewQuotationPage] Error loading customers:", err);
    }
  }

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base">
            <CreateQuotationForm
              customers={customerList}
              initialCustomer={initialCustomer}
              initialCustomerId={initialCustomer?.id}
              isCustomerRole={isCustomerRole}
            />
          </div>
        </main>
      </div>
    </>
  );
}
