import { Metadata } from "next";
import { InventoryOverviewPage } from "@/features/inventory/pages/InventoryOverviewPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Inventory Dashboard & Visibility",
  description: "Enterprise stock visibility across regional distribution hubs for quotation workflows",
};

export const dynamic = "force-dynamic";

export default function InventoryRoute() {
  return <InventoryOverviewPage />;
}
