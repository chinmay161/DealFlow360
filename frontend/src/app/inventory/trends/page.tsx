import { Metadata } from "next";
import { InventoryTrendsPage } from "@/features/inventory/pages/InventoryTrendsPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Inventory Trends & Telemetry",
  description: "Stock movement, reservation surges, and consignment turnaround telemetry",
};

export const dynamic = "force-dynamic";

export default function TrendsRoute() {
  return <InventoryTrendsPage />;
}
