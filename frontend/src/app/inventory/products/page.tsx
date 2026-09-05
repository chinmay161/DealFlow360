import { Metadata } from "next";
import { ProductAvailabilityPage } from "@/features/inventory/pages/ProductAvailabilityPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Product Availability & Free Stock Catalog",
  description: "Enterprise catalog stock availability, committed reservations, and unallocated free stock",
};

export const dynamic = "force-dynamic";

export default function ProductsRoute() {
  return <ProductAvailabilityPage />;
}
