"use server";

import { revalidatePath } from "next/cache";
import { confirmFulfillmentPlan, getLiveFulfillmentData } from "@/lib/services/fulfillmentService";

export async function getFulfillmentDataAction(quoteIdentifier = "Q-1042") {
  return await getLiveFulfillmentData(quoteIdentifier);
}

export async function confirmFulfillmentPlanAction(quoteIdentifier = "Q-1042") {
  const result = await confirmFulfillmentPlan(quoteIdentifier);

  try {
    revalidatePath("/fulfillment");
    revalidatePath("/quotations");
    revalidatePath("/invoices");
    revalidatePath("/overview");
    revalidatePath("/dashboard");
  } catch {
    // Safe no-op outside Next request context
  }

  return result;
}
