import type { Metadata } from "next";
import { FulfillmentPage } from "@/components/fulfillment/FulfillmentPage";
import { getLiveFulfillmentData } from "@/lib/services/fulfillmentService";

export const metadata: Metadata = {
  title: "DealFlow360 - Fulfillment | ORD-1042",
  description: "Enterprise fulfillment planning for order ORD-1042",
};

export const dynamic = "force-dynamic";

export default async function FulfillmentRoute() {
  let initialData = undefined;
  try {
    initialData = await getLiveFulfillmentData("Q-1042");
  } catch (err) {
    console.error("Could not fetch live fulfillment data:", err);
  }

  return <FulfillmentPage initialData={initialData} />;
}

