import { Metadata } from "next";
import { ReservationDashboardPage } from "@/features/inventory/pages/ReservationDashboardPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Quotation Inventory Reservations",
  description: "Committed stock allocations for commercial quotations and pending review deals",
};

export const dynamic = "force-dynamic";

export default function ReservationsRoute() {
  return <ReservationDashboardPage />;
}
