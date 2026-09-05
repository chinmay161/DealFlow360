"use server";

import { revalidatePath } from "next/cache";
import {
  getLiveSubscriptionsData,
  pauseSubscriptionAction,
  resumeSubscriptionAction,
} from "@/lib/services/subscriptionService";

export async function getSubscriptionsDataAction() {
  return await getLiveSubscriptionsData();
}

export async function pauseSubscriptionServerAction(id: string) {
  const res = await pauseSubscriptionAction(id);
  try {
    revalidatePath("/subscriptions");
    revalidatePath("/overview");
    revalidatePath("/dashboard");
  } catch {}
  return res;
}

export async function resumeSubscriptionServerAction(id: string) {
  const res = await resumeSubscriptionAction(id);
  try {
    revalidatePath("/subscriptions");
    revalidatePath("/overview");
    revalidatePath("/dashboard");
  } catch {}
  return res;
}
