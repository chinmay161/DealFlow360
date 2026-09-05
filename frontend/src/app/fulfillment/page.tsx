import type { Metadata } from "next";
import { FulfillmentPage } from "@/components/fulfillment/FulfillmentPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Fulfillment | ORD-1042",
  description: "Enterprise fulfillment planning for order ORD-1042",
};

export default function FulfillmentRoute() {
  return <FulfillmentPage />;
}
