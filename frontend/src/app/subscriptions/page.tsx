import type { Metadata } from "next";
import { SubscriptionsPage } from "@/components/subscriptions/SubscriptionsPage";
import { getLiveSubscriptionsData } from "@/lib/services/subscriptionService";

export const metadata: Metadata = {
  title: "DealFlow360 - Subscriptions",
  description: "Manage recurring customer commitments, billing schedules, and renewals.",
};

export const dynamic = "force-dynamic";

export default async function SubscriptionsRoute() {
  let initialData = undefined;
  try {
    initialData = await getLiveSubscriptionsData();
  } catch (err) {
    console.error("Failed to load live subscriptions:", err);
  }

  return <SubscriptionsPage initialData={initialData} />;
}

