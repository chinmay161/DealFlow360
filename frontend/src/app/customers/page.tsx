import { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { CustomerDirectoryTable } from "@/components/customers/CustomerDirectoryTable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Customers | Commercial Accounts",
  description: "Browse, manage, and register enterprise accounts in DealFlow360",
};

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      contacts: true,
      quotations: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedCustomers = customers.map((c) => ({
    id: c.id,
    customerNumber: c.customerNumber || `CUST-${c.id.slice(0, 6)}`,
    name: c.name,
    externalAccountId: c.externalAccountId,
    industry: c.industry,
    tier: c.tier,
    paymentTerms: c.paymentTerms,
    creditLimit: Number(c.creditLimit),
    creditAvailable: Number(c.creditAvailable),
    territory: c.territory,
    city: c.city,
    state: c.state,
    activeStatus: (c as any).isActive ?? true,
    quotationCount: c.quotations.length,
    primaryContact: (() => {
      const cnt = c.contacts.find((cn) => cn.isPrimary) || c.contacts[0];
      return cnt ? { name: cnt.name, title: cnt.title, email: cnt.email } : null;
    })(),
  }));

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
                  Enterprise Accounts &amp; Customers
                </h1>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  Directory of commercial buyer accounts, credit lines, and customer governance.
                </p>
              </div>
            </div>

            <CustomerDirectoryTable customers={formattedCustomers} />
          </div>
        </main>
      </div>
    </>
  );
}
