import type { Metadata } from "next";
import { SubscriptionsPage } from "@/components/subscriptions/SubscriptionsPage";

export const metadata: Metadata = {
  title: "DealFlow360 - Subscriptions",
  description: "Manage recurring customer commitments, billing schedules, and renewals.",
};

export default function SubscriptionsRoute() {
  return <SubscriptionsPage />;
}
