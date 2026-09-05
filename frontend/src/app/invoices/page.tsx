import type { Metadata } from "next";
import { InvoicesPage } from "@/components/invoices/InvoicesPage";
import { getLiveInvoicesData } from "@/lib/services/billingService";

export const metadata: Metadata = {
  title: "DealFlow360 - Invoices",
  description: "Manage one-time and recurring customer billing.",
};

export const dynamic = "force-dynamic";

export default async function InvoicesRoute() {
  let initialData = undefined;
  try {
    initialData = await getLiveInvoicesData();
  } catch (err) {
    console.error("Failed to load live invoices:", err);
  }

  return <InvoicesPage initialData={initialData} />;
}

