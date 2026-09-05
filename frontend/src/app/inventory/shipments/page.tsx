import { Metadata } from "next";
import { ShipmentDashboardPage } from "@/features/inventory/pages/ShipmentDashboardPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Outbound Shipments & Consignment Tracking",
  description: "Live 4-stage tracking for customer shipments: Reserved, Packed, Shipped, Delivered",
};

export const dynamic = "force-dynamic";

export default function ShipmentsRoute() {
  return <ShipmentDashboardPage />;
}
