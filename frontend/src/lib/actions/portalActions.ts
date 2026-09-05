"use server";

import { revalidatePath } from "next/cache";
import { submitCounterOffer, acceptQuotationByCustomer } from "@/lib/services/portalService";

export async function submitCounterOfferAction(input: {
  quotationId: string;
  proposedDiscount?: number;
  comments: string;
  actorName?: string;
}) {
  const result = await submitCounterOffer(input);
  try {
    revalidatePath("/portal");
    revalidatePath("/portal/quotations");
    revalidatePath(`/portal/quotations/${input.quotationId}`);
    revalidatePath("/quotations");
    revalidatePath("/approvals");
  } catch {}
  return result;
}

export async function acceptQuotationAction(input: {
  quotationId: string;
  signatoryName: string;
  signatoryTitle: string;
  signatoryEmail: string;
}) {
  const result = await acceptQuotationByCustomer(input);
  try {
    revalidatePath("/portal");
    revalidatePath("/portal/quotations");
    revalidatePath(`/portal/quotations/${input.quotationId}`);
    revalidatePath("/quotations");
    revalidatePath("/fulfillment");
    revalidatePath("/invoices");
    revalidatePath("/overview");
    revalidatePath("/dashboard");
  } catch {}
  return result;
}
