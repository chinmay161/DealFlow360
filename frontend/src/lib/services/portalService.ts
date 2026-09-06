import { prisma } from "@/lib/prisma";
import { QuotationStatus } from "@prisma/client";
import { confirmFulfillmentPlan } from "./fulfillmentService";

export interface SanitizedCustomerQuote {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  status: string;
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalValue: number;
  paymentTerms: string;
  createdAt: string;
  validUntil: string;
  primaryContact?: {
    name: string;
    title?: string | null;
    email: string;
  } | null;
  lineItems: Array<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    lineTotal: number;
  }>;
  negotiations: Array<{
    id: string;
    proposedDiscount?: number | null;
    comments: string;
    status: string;
    createdAt: string;
  }>;
}

export async function getCustomerQuotations(customerId: string) {
  if (!customerId) return [];

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { contacts: true },
  });

  if (!customer) return [];

  const quotes = await prisma.quotation.findMany({
    where: { customerId: customer.id },
    include: {
      customer: { include: { contacts: true } },
      lineItems: { include: { product: true } },
      negotiations: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return quotes.map((q) => sanitizeQuotationForCustomer(q));
}

export async function getCustomerQuotationDetail(
  identifier: string,
  customerId?: string
) {
  if (!identifier) return null;

  const quote = await prisma.quotation.findFirst({
    where: {
      OR: [{ quotationNumber: identifier }, { id: identifier }],
      ...(customerId ? { customerId } : {}),
    },
    include: {
      customer: { include: { contacts: true } },
      lineItems: { include: { product: true } },
      negotiations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!quote) return null;
  return sanitizeQuotationForCustomer(quote);
}

function sanitizeQuotationForCustomer(quote: any): SanitizedCustomerQuote {
  // 30 days validity
  const validUntilDate = new Date(quote.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const primaryContact =
    quote.customer.contacts?.find((c: any) => c.isPrimary) ||
    quote.customer.contacts?.[0] ||
    null;

  return {
    id: quote.id,
    quotationNumber: quote.quotationNumber,
    customerId: quote.customerId,
    customerName: quote.customer.name,
    customerCode: quote.customer.customerNumber || quote.customer.externalAccountId || "CUST-00001",
    status: quote.status,
    currency: quote.currency || "INR",
    subtotal: Number(quote.subtotal),
    discountTotal: Number(quote.discountTotal),
    taxTotal: Number(quote.taxTotal),
    totalValue: Number(quote.totalValue),
    paymentTerms: quote.customer.paymentTerms || "Net 30 Days from delivery",
    createdAt: quote.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    validUntil: validUntilDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    primaryContact: primaryContact
      ? {
          name: primaryContact.name,
          title: primaryContact.title || "Commercial Contact",
          email: primaryContact.email,
        }
      : null,
    lineItems: quote.lineItems.map((li: any) => ({
      id: li.id,
      productName: li.productName,
      sku: li.sku || li.product?.sku || "SKU",
      quantity: li.quantity,
      unitPrice: Number(li.unitPrice),
      discountPercent: Number(li.discountPercent),
      lineTotal: Number(li.lineTotal),
    })),
    negotiations: quote.negotiations?.map((neg: any) => ({
      id: neg.id,
      proposedDiscount: neg.proposedDiscount ? Number(neg.proposedDiscount) : null,
      comments: neg.comments,
      status: neg.status,
      createdAt: neg.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    })) || [],
  };
}

export async function submitCounterOffer(params: {
  quotationId: string;
  customerId?: string;
  proposedDiscount?: number;
  comments: string;
  actorName?: string;
  actorEmail?: string;
}) {
  const quote = await prisma.quotation.findUnique({
    where: { id: params.quotationId },
  });

  if (!quote) throw new Error(`Quotation ${params.quotationId} not found`);

  // Server-side authorization check: quote must belong to the customer
  if (params.customerId && quote.customerId !== params.customerId) {
    throw new Error("Unauthorized: Quotation does not belong to your customer account");
  }

  return await prisma.$transaction(async (tx) => {
    const neg = await tx.customerNegotiation.create({
      data: {
        quotationId: quote.id,
        authorName: params.actorName || "Buyer Representative",
        authorEmail: params.actorEmail || "buyer@customer.example",
        authorRole: "CUSTOMER",
        eventType: "COUNTER_OFFER",
        message: params.comments,
        changes: params.proposedDiscount ? { proposedDiscount: params.proposedDiscount } : undefined,
      },
    });

    await tx.quotation.update({
      where: { id: quote.id },
      data: {
        status: QuotationStatus.IN_REVIEW,
        currentStage: "Customer Counter-Offer Review",
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "Quotation",
        entityId: quote.id,
        action: "CUSTOMER_COUNTER_OFFER",
        fromState: quote.status,
        toState: QuotationStatus.IN_REVIEW,
        metadata: {
          comments: params.comments,
          proposedDiscount: params.proposedDiscount,
          actor: params.actorName || "Buyer Representative",
        },
      },
    });

    return { success: true, negotiationId: neg.id };
  });
}

export async function acceptQuotationByCustomer(params: {
  quotationId: string;
  customerId?: string;
  signatoryName: string;
  signatoryTitle: string;
  signatoryEmail: string;
}) {
  const quote = await prisma.quotation.findUnique({
    where: { id: params.quotationId },
    include: { customer: true, lineItems: true },
  });

  if (!quote) throw new Error(`Quotation ${params.quotationId} not found`);

  // Server-side authorization check: quote must belong to the customer
  if (params.customerId && quote.customerId !== params.customerId) {
    throw new Error("Unauthorized: Quotation does not belong to your customer account");
  }

  // Idempotency: If already accepted, return success without duplicate processing
  if (quote.status === QuotationStatus.ACCEPTED) {
    return {
      success: true,
      quotationNumber: quote.quotationNumber,
      status: "ACCEPTED",
      alreadyAccepted: true,
    };
  }

  // 1. Update quotation status to ACCEPTED
  await prisma.quotation.update({
    where: { id: quote.id },
    data: {
      status: QuotationStatus.ACCEPTED,
      currentStage: "Customer Accepted & Signed",
    },
  });

  // 2. Trigger automated fulfillment confirmation
  try {
    await confirmFulfillmentPlan(quote.quotationNumber);
  } catch (err) {
    console.error("Fulfillment plan auto-creation on accept:", err);
  }

  // 3. Record Audit Log
  await prisma.auditLog.create({
    data: {
      entity: "Quotation",
      entityId: quote.id,
      action: "CUSTOMER_ACCEPT_SIGN",
      fromState: quote.status,
      toState: QuotationStatus.ACCEPTED,
      metadata: {
        signatoryName: params.signatoryName,
        signatoryTitle: params.signatoryTitle,
        signatoryEmail: params.signatoryEmail,
        timestamp: new Date().toISOString(),
      },
    },
  });

  return {
    success: true,
    quotationNumber: quote.quotationNumber,
    status: "ACCEPTED",
  };
}
