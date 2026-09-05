import { Metadata } from "next";
import { InventoryAlertsPage } from "@/features/inventory/pages/InventoryAlertsPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Inventory Alerts & Business Insights",
  description: "Low stock notifications, shipment delays, and autonomous business insights",
};

export const dynamic = "force-dynamic";

export default function AlertsRoute() {
  return <InventoryAlertsPage />;
}
