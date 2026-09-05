"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  AddLineItemSchema,
  UpdateLineItemSchema,
  RemoveLineItemSchema,
  SwitchCustomerSchema,
  QuickAddBundleSchema,
  SubmitForApprovalSchema,
} from "@/lib/validations/quotation";
import {
  addLineItemToQuote,
  updateQuoteLineItem,
  removeQuoteLineItem,
  duplicateQuoteLineItem,
  switchQuoteCustomer,
  addBundleToQuote,
} from "@/lib/services/quoteService";
import { submitQuoteForApproval } from "@/lib/services/approvalService";

function safeRevalidateQuote(quotationId?: string) {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/quotations", "layout");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/approvals", "layout");
    if (quotationId) {
      revalidatePath(`/quotations/${quotationId}`);
    }
  } catch {
    // Safe no-op outside Next.js request context (e.g. CLI tests)
  }
}

export async function addLineItemAction(input: unknown) {
  const parsed = AddLineItemSchema.parse(input);
  const result = await addLineItemToQuote({
    quotationId: parsed.quotationId,
    productId: parsed.productId,
    quantity: parsed.quantity,
    discountPercent: parsed.discountPercent,
    unitPriceOverride: parsed.unitPriceOverride,
  });

  safeRevalidateQuote(parsed.quotationId);
  return { success: true, item: result };
}

export async function updateLineItemAction(input: unknown) {
  const parsed = UpdateLineItemSchema.parse(input);
  const quote = await updateQuoteLineItem({
    lineItemId: parsed.lineItemId,
    quantity: parsed.quantity,
    discountPercent: parsed.discountPercent,
    unitPriceOverride: parsed.unitPriceOverride,
  });

  safeRevalidateQuote();
  return { success: true, quotation: quote };
}

export async function removeLineItemAction(input: unknown) {
  const parsed = RemoveLineItemSchema.parse(input);
  const quote = await removeQuoteLineItem(parsed.lineItemId);

  safeRevalidateQuote();
  return { success: true, quotation: quote };
}

export async function duplicateLineItemAction(lineItemId: string) {
  const validId = z.string().uuid("Invalid line item ID").parse(lineItemId);
  const result = await duplicateQuoteLineItem(validId);
  safeRevalidateQuote(result.quotationId);
  return { success: true, item: result };
}

export async function switchCustomerAction(input: unknown) {
  const parsed = SwitchCustomerSchema.parse(input);
  const updated = await switchQuoteCustomer(parsed.quotationId, parsed.customerId);

  safeRevalidateQuote(parsed.quotationId);
  return { success: true, quotation: updated };
}

export async function quickAddBundleAction(input: unknown) {
  const parsed = QuickAddBundleSchema.parse(input);
  const result = await addBundleToQuote(parsed.quotationId, parsed.bundleType);

  safeRevalidateQuote(parsed.quotationId);
  return { success: true, items: result.items, quotation: result.quotation };
}

export async function submitForApprovalAction(input: unknown) {
  const parsed = SubmitForApprovalSchema.parse(input);
  const approval = await submitQuoteForApproval(parsed.quotationId, parsed.notes);

  safeRevalidateQuote(parsed.quotationId);
  return { success: true, approval };
}

export async function createNewQuotationAction() {
  const count = await prisma.quotation.count();
  const nextNum = `Q-${1050 + count}`;

  const defaultCustomer = await prisma.customer.findFirst({
    where: { name: "Apex Infotech Pvt. Ltd." },
  }) ?? await prisma.customer.findFirst();

  const defaultOwner = await prisma.user.findFirst({
    where: { email: "arjun.mehta@dealflow360.in" },
  }) ?? await prisma.user.findFirst();

  if (!defaultCustomer || !defaultOwner) {
    throw new Error("Cannot create quotation: missing default customer or owner");
  }

  const quote = await prisma.quotation.create({
    data: {
      quotationNumber: nextNum,
      customerId: defaultCustomer.id,
      ownerId: defaultOwner.id,
      status: "DRAFT",
      currentStage: "Drafting",
      currency: "INR",
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      totalValue: 0,
      estimatedMargin: 35,
      riskScore: 10,
    },
  });

  safeRevalidateQuote(quote.id);
  return { success: true, quotationNumber: quote.quotationNumber };
}
