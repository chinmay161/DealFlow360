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
  CreateQuotationSchema,
} from "@/lib/validations/quotation";
import { getCurrentUser } from "@/lib/auth";
import { getAuthoritativeCustomerForSession } from "@/lib/services/portalAuthService";
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

async function getNextQuotationNumber(): Promise<string> {
  const existingQuotes = await prisma.quotation.findMany({
    select: { quotationNumber: true },
  });
  let maxNum = 1000;
  for (const q of existingQuotes) {
    const match = q.quotationNumber.match(/^Q-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `Q-${maxNum + 1}`;
}

async function resolveAuthenticatedOwner() {
  try {
    const sessionUser = await getCurrentUser();
    if (sessionUser?.email) {
      const user = await prisma.user.findUnique({
        where: { email: sessionUser.email },
      });
      if (user) return user;
    }
  } catch {
    // Session retrieval outside Next request context
  }

  const fallback = await prisma.user.findFirst({
    where: { email: "arjun.mehta@dealflow360.in" },
  }) ?? await prisma.user.findFirst();

  if (!fallback) {
    throw new Error("Cannot create quotation: No active user found in database");
  }
  return fallback;
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
  const currentUser = await getCurrentUser();
  if (currentUser?.role === "CUSTOMER") {
    throw new Error("Unauthorized: Customer portal users cannot switch quotation organizations");
  }

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

export async function createNewQuotationAction(customerId?: string) {
  const currentUser = await getCurrentUser();
  let targetCustomerId: string;
  let targetOwnerId: string;

  if (currentUser?.role === "CUSTOMER") {
    const authCustomer = await getAuthoritativeCustomerForSession(currentUser);
    if (!authCustomer) {
      throw new Error("Unauthorized: Customer organization profile could not be verified");
    }
    if (customerId && customerId !== authCustomer.id) {
      throw new Error("Unauthorized: Customer users cannot create quotations for other organizations");
    }
    targetCustomerId = authCustomer.id;
    targetOwnerId = authCustomer.ownerId || (await resolveAuthenticatedOwner()).id;
  } else {
    let targetCustomer = null;
    if (customerId) {
      targetCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
    }

    if (!targetCustomer) {
      targetCustomer = await prisma.customer.findFirst({
        orderBy: { createdAt: "asc" },
      });
    }

    if (!targetCustomer) {
      throw new Error("Cannot create quotation: No customer found in database");
    }

    targetCustomerId = targetCustomer.id;
    const owner = await resolveAuthenticatedOwner();
    targetOwnerId = owner.id;
  }

  const nextNum = await getNextQuotationNumber();

  const quote = await prisma.quotation.create({
    data: {
      quotationNumber: nextNum,
      customerId: targetCustomerId,
      ownerId: targetOwnerId,
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
  return { success: true, id: quote.id, quotationNumber: quote.quotationNumber };
}

export async function createQuotationWithDetailsAction(input: unknown) {
  const validated = CreateQuotationSchema.parse(input);
  const currentUser = await getCurrentUser();

  let targetCustomerId: string;
  let targetOwnerId: string;

  if (currentUser?.role === "CUSTOMER") {
    // Server-side enforcement: CUSTOMER user can ONLY create quotations for their own organization
    const authCustomer = await getAuthoritativeCustomerForSession(currentUser);
    if (!authCustomer) {
      throw new Error("Unauthorized: Customer organization profile could not be verified");
    }

    // Reject conflicting customerId explicitly
    if (validated.customerId && validated.customerId !== authCustomer.id) {
      throw new Error("Unauthorized: Customer users cannot create quotations for other organizations");
    }

    targetCustomerId = authCustomer.id;
    targetOwnerId = authCustomer.ownerId || (await resolveAuthenticatedOwner()).id;
  } else {
    // Internal sales rep / employee flow
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });

    if (!customer) {
      throw new Error("Selected customer not found in database");
    }

    targetCustomerId = customer.id;
    const owner = await resolveAuthenticatedOwner();
    targetOwnerId = owner.id;
  }

  const nextNum = await getNextQuotationNumber();

  const quote = await prisma.quotation.create({
    data: {
      quotationNumber: nextNum,
      customerId: targetCustomerId,
      ownerId: targetOwnerId,
      status: "DRAFT",
      currentStage: "Drafting",
      currency: validated.currency || "INR",
      notes: validated.notes || null,
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      totalValue: 0,
      estimatedMargin: 35,
      riskScore: 10,
    },
  });

  safeRevalidateQuote(quote.id);
  return {
    success: true,
    id: quote.id,
    quotationNumber: quote.quotationNumber,
  };
}

export async function saveQuotationDraftAction(quotationId: string) {
  const validId = z.string().uuid("Invalid quotation ID").parse(quotationId);

  const quote = await prisma.quotation.findUnique({
    where: { id: validId },
  });

  if (!quote) {
    throw new Error(`Quotation ${validId} not found`);
  }

  const { recalculateQuoteTotalsAndRisk } = await import("@/lib/services/quoteService");
  await recalculateQuoteTotalsAndRisk(validId);

  try {
    const { evaluateQuotationRules } = await import("@/lib/services/governanceBridge");
    await evaluateQuotationRules(validId);
  } catch (err) {
    console.error("Rule evaluation on draft save:", err);
  }

  safeRevalidateQuote(validId);
  return {
    success: true,
    quotationId: validId,
    updatedAt: new Date().toISOString(),
  };
}

