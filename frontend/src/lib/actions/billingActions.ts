"use server";

import { revalidatePath } from "next/cache";
import { getLiveInvoicesData, recordPaymentAction, issueCreditNoteAction } from "@/lib/services/billingService";

export async function getInvoicesDataAction() {
  return await getLiveInvoicesData();
}

export async function recordPaymentServerAction(input: {
  invoiceNumber: string;
  amount: number;
  method?: string;
}) {
  const result = await recordPaymentAction(input);
  try {
    revalidatePath("/invoices");
    revalidatePath("/overview");
    revalidatePath("/dashboard");
  } catch {}
  return result;
}

export async function issueCreditNoteServerAction(input: {
  invoiceNumber: string;
  amount: number;
  reason: string;
}) {
  const result = await issueCreditNoteAction(input);
  try {
    revalidatePath("/invoices");
    revalidatePath("/overview");
    revalidatePath("/dashboard");
  } catch {}
  return result;
}
