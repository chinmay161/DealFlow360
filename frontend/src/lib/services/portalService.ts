import { prisma } from "@/lib/prisma";
import { QuotationStatus } from "@prisma/client";
import { confirmFulfillmentPlan } from "./fulfillmentService";

export interface SanitizedCustomerQuote {
  id: string;
  quotationNumber: string;
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

export async function getCustomerQuotations(customerName = "Apex Infotech Pvt. Ltd.") {
  const searchKeyword = customerName.split(" ")[0] || "Apex";
  const customer = await prisma.customer.findFirst({
    where: { name: { contains: searchKeyword } },
  });

  const quotes = await prisma.quotation.findMany({
    where: customer ? { customerId: customer.id } : {},
    include: {
      customer: true,
      lineItems: { include: { product: true } },
      negotiations: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return quotes.map((q) => sanitizeQuotationForCustomer(q));
}

export async function getCustomerQuotationDetail(identifier: string) {
  const quote = await prisma.quotation.findFirst({
    where: {
      OR: [{ quotationNumber: identifier }, { id: identifier }],
    },
    include: {
      customer: true,
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

  return {
    id: quote.id,
    quotationNumber: quote.quotationNumber,
    customerName: quote.customer.name,
    customerCode: quote.customer.customerCode || "CUST-00001",
    status: quote.status,
    currency: quote.currency || "INR",
    subtotal: Number(quote.subtotal),
    discountTotal: Number(quote.discountTotal),
    taxTotal: Number(quote.taxTotal),
    totalValue: Number(quote.totalValue),
    paymentTerms: "Net 30 Days from delivery",
    createdAt: quote.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    validUntil: validUntilDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
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
  proposedDiscount?: number;
  comments: string;
  actorName?: string;
}) {
  const quote = await prisma.quotation.findUnique({
    where: { id: params.quotationId },
  });

  if (!quote) throw new Error(`Quotation ${params.quotationId} not found`);

  return await prisma.$transaction(async (tx) => {
    const neg = await tx.customerNegotiation.create({
      data: {
        quotationId: quote.id,
        authorName: params.actorName || "Buyer Representative",
        authorEmail: "buyer@enterprise.example",
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
  signatoryName: string;
  signatoryTitle: string;
  signatoryEmail: string;
}) {
  const quote = await prisma.quotation.findUnique({
    where: { id: params.quotationId },
    include: { customer: true, lineItems: true },
  });

  if (!quote) throw new Error(`Quotation ${params.quotationId} not found`);

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
