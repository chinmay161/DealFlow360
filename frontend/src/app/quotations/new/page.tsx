import { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { CreateQuotationForm, CustomerOption } from "@/components/quotations/CreateQuotationForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Create Quotation",
  description: "Create a new customer quotation in DealFlow360",
};

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewQuotationPage({ searchParams }: PageProps) {
  let customers: CustomerOption[] = [];
  const resolvedParams = searchParams ? await searchParams : {};
  const customerIdParam = typeof resolvedParams.customerId === "string" ? resolvedParams.customerId : undefined;

  try {
    const rawCustomers = await prisma.customer.findMany({
      select: {
        id: true,
        customerNumber: true,
        name: true,
        externalAccountId: true,
        industry: true,
        tier: true,
        city: true,
        state: true,
        country: true,
        paymentTerms: true,
        contacts: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
          },
          orderBy: { isPrimary: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    customers = rawCustomers.map((c) => ({
      id: c.id,
      customerNumber: c.customerNumber,
      name: c.name,
      externalAccountId: c.externalAccountId,
      industry: c.industry,
      tier: c.tier,
      city: c.city,
      state: c.state,
      country: c.country,
      paymentTerms: c.paymentTerms,
      contacts: c.contacts.map((ct) => ({
        id: ct.id,
        name: ct.name,
        email: ct.email,
        title: ct.title,
      })),
    }));
  } catch (err) {
    console.error("[NewQuotationPage] Error loading customers:", err);
  }

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base">
            <CreateQuotationForm
              customers={customers}
              initialCustomerId={customerIdParam}
            />
          </div>
        </main>
      </div>
    </>
  );
}
