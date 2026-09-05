import type { Metadata } from "next";
import { InvoicesPage } from "@/components/invoices/InvoicesPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Invoices",
  description: "Manage one-time and recurring customer billing.",
};

export default function InvoicesRoute() {
  return <InvoicesPage />;
}
