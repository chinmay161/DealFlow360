import { Metadata } from "next";
import { WarehouseOverviewPage } from "@/features/inventory/pages/WarehouseOverviewPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Warehouses & Hub Utilization",
  description: "Regional warehouse capacities, stock buffers, and hub comparison",
};

export const dynamic = "force-dynamic";

export default function WarehousesRoute() {
  return <WarehouseOverviewPage />;
}
