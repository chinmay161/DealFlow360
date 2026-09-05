import { prisma } from "@/lib/prisma";
import { QuotationStatus, ApprovalStatus, ApprovalPriority, WorkflowStepStatus } from "@prisma/client";

export type QuoteLineItemId = string;
export type ProductId = string;
export type QuotationId = string;

export interface SerializedProductSummary {
  id: ProductId;
  sku: string;
  name: string;
  description: string | null;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
}

export interface SerializedQuoteLineItem {
  id: QuoteLineItemId;
  quotationId: QuotationId;
  productId: ProductId | null;
  product?: SerializedProductSummary | null;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountLimitPercent: number | null;
  estimatedMarginPercent: number | null;
  lineTotal: number;
  governanceStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLineItemInputRecord {
  id: string;
  quotationId: string;
  productId?: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
    description?: string | null;
    unitPrice: unknown;
    costPrice: unknown;
    taxRate: unknown;
  } | null;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: unknown;
  discountPercent: unknown;
  discountLimitPercent?: unknown;
  estimatedMarginPercent?: unknown;
  lineTotal: unknown;
  governanceStatus?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function serializeQuoteLineItem(li: QuoteLineItemInputRecord): SerializedQuoteLineItem {
  return {
    id: li.id,
    quotationId: li.quotationId,
    productId: li.productId ?? null,
    product: li.product
      ? {
          id: li.product.id,
          sku: li.product.sku,
          name: li.product.name,
          description: li.product.description ?? null,
          unitPrice: Number(li.product.unitPrice),
          costPrice: Number(li.product.costPrice),
          taxRate: Number(li.product.taxRate),
        }
      : null,
    productName: li.productName,
    sku: li.sku ?? null,
    quantity: li.quantity,
    unitPrice: Number(li.unitPrice),
    discountPercent: Number(li.discountPercent),
    discountLimitPercent: li.discountLimitPercent != null ? Number(li.discountLimitPercent) : null,
    estimatedMarginPercent: li.estimatedMarginPercent != null ? Number(li.estimatedMarginPercent) : null,
    lineTotal: Number(li.lineTotal),
    governanceStatus: li.governanceStatus ?? null,
    createdAt: typeof li.createdAt === "string" ? li.createdAt : li.createdAt.toISOString(),
    updatedAt: typeof li.updatedAt === "string" ? li.updatedAt : li.updatedAt.toISOString(),
  };
}

export interface SerializedWorkflowStep {
  id: string;
  stepOrder: number;
  role: string;
  status: WorkflowStepStatus;
  notes: string | null;
  approver: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl: string | null;
  } | null;
}

export interface SerializedApproval {
  id: string;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  currentStep: number;
  submittedAt: string;
  requestedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  workflowSteps: SerializedWorkflowStep[];
}

export interface SerializedCustomerContact {
  id: string;
  name: string;
  email: string;
  title?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

export interface SerializedCustomer {
  id: string;
  customerNumber: string | null;
  name: string;
  externalAccountId: string | null;
  industry: string | null;
  city?: string | null;
  state?: string | null;
  tier?: string | null;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  creditAvailable?: number | null;
  territory?: string | null;
  contacts?: SerializedCustomerContact[];
}

export interface SerializedOwner {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export interface SerializedQuotationDetail {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer: SerializedCustomer;
  ownerId: string;
  owner: SerializedOwner;
  status: QuotationStatus;
  currentStage: string | null;
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalValue: number;
  estimatedMargin: number;
  riskScore: number | null;
  createdAt: string;
  updatedAt: string;
  lineItems: SerializedQuoteLineItem[];
  approvals: SerializedApproval[];
}

export interface SerializedQuotationListItem {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer: SerializedCustomer;
  ownerId: string;
  owner: SerializedOwner;
  status: QuotationStatus;
  currentStage: string | null;
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalValue: number;
  estimatedMargin: number;
  riskScore: number | null;
  lineItemCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all quotations for list / table views.
 */
export async function getQuotations(): Promise<SerializedQuotationListItem[]> {
  try {
    const records = await prisma.quotation.findMany({
      include: {
        customer: true,
        owner: true,
        _count: {
          select: { lineItems: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      customerId: q.customerId,
      customer: {
        id: q.customer.id,
        customerNumber: q.customer.customerNumber,
        name: q.customer.name,
        externalAccountId: q.customer.externalAccountId,
        industry: q.customer.industry,
        city: q.customer.city,
        state: q.customer.state,
        tier: q.customer.tier,
      },
      ownerId: q.ownerId,
      owner: {
        id: q.owner.id,
        name: q.owner.name,
        email: q.owner.email,
        role: q.owner.role,
        avatarUrl: q.owner.avatarUrl,
      },
      status: q.status,
      currentStage: q.currentStage,
      currency: q.currency,
      subtotal: Number(q.subtotal),
      discountTotal: Number(q.discountTotal),
      taxTotal: Number(q.taxTotal),
      totalValue: Number(q.totalValue),
      estimatedMargin: Number(q.estimatedMargin),
      riskScore: q.riskScore,
      lineItemCount: q._count.lineItems,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("[getQuotations] Database error:", error);
    throw new Error("Unable to load quotations.");
  }
}

/**
 * Fetch a single quotation by quotationNumber (e.g. "Q-1042") with line items and approvals.
 */
export async function getQuotationByNumber(
  quotationNumber: string
): Promise<SerializedQuotationDetail | null> {
  try {
    const q = await prisma.quotation.findUnique({
      where: { quotationNumber },
      include: {
        customer: {
          include: { contacts: true },
        },
        owner: true,
        lineItems: {
          include: { product: true },
          orderBy: { createdAt: "asc" },
        },
        approvals: {
          include: {
            requestedBy: true,
            assignedTo: true,
            workflowSteps: {
              include: { approver: true },
              orderBy: { stepOrder: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!q) return null;

    return {
      id: q.id,
      quotationNumber: q.quotationNumber,
      customerId: q.customerId,
      customer: {
        id: q.customer.id,
        customerNumber: q.customer.customerNumber,
        name: q.customer.name,
        externalAccountId: q.customer.externalAccountId,
        industry: q.customer.industry,
        city: q.customer.city,
        state: q.customer.state,
        tier: q.customer.tier,
        paymentTerms: q.customer.paymentTerms,
        creditLimit: q.customer.creditLimit ? Number(q.customer.creditLimit) : null,
        creditAvailable: q.customer.creditAvailable ? Number(q.customer.creditAvailable) : null,
        territory: q.customer.territory,
        contacts: q.customer.contacts?.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          title: c.title,
          phone: c.phone,
          isPrimary: c.isPrimary,
        })),
      },
      ownerId: q.ownerId,
      owner: {
        id: q.owner.id,
        name: q.owner.name,
        email: q.owner.email,
        role: q.owner.role,
        avatarUrl: q.owner.avatarUrl,
      },
      status: q.status,
      currentStage: q.currentStage,
      currency: q.currency,
      subtotal: Number(q.subtotal),
      discountTotal: Number(q.discountTotal),
      taxTotal: Number(q.taxTotal),
      totalValue: Number(q.totalValue),
      estimatedMargin: Number(q.estimatedMargin),
      riskScore: q.riskScore,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      lineItems: q.lineItems.map(serializeQuoteLineItem),
      approvals: q.approvals.map((appr) => ({
        id: appr.id,
        status: appr.status,
        priority: appr.priority,
        currentStep: appr.currentStep,
        submittedAt: appr.submittedAt.toISOString(),
        requestedBy: {
          id: appr.requestedBy.id,
          name: appr.requestedBy.name,
          email: appr.requestedBy.email,
        },
        assignedTo: appr.assignedTo
          ? {
              id: appr.assignedTo.id,
              name: appr.assignedTo.name,
              email: appr.assignedTo.email,
            }
          : null,
        workflowSteps: appr.workflowSteps.map((st) => ({
          id: st.id,
          stepOrder: st.stepOrder,
          role: st.role,
          status: st.status,
          notes: st.notes,
          approver: st.approver
            ? {
                id: st.approver.id,
                name: st.approver.name,
                email: st.approver.email,
                role: st.approver.role,
                avatarUrl: st.approver.avatarUrl,
              }
            : null,
        })),
      })),
    };
  } catch (error) {
    console.error(`[getQuotationByNumber] Database error for "${quotationNumber}":`, error);
    throw new Error("Unable to load quotations.");
  }
}

/**
 * Fetch a single quotation by internal ID or quotation number with full line items and relations.
 */
export async function getQuotationWithLineItems(
  identifier: string
): Promise<SerializedQuotationDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  // If starts with "Q-", query by quotationNumber first
  if (identifier.toUpperCase().startsWith("Q-")) {
    const byNumber = await getQuotationByNumber(identifier.toUpperCase());
    if (byNumber) return byNumber;
  }

  // If valid UUID, query by UUID id
  if (isUuid) {
    try {
      const q = await prisma.quotation.findUnique({
        where: { id: identifier },
        include: {
          customer: {
            include: { contacts: true },
          },
          owner: true,
          lineItems: {
            include: { product: true },
            orderBy: { createdAt: "asc" },
          },
          approvals: {
            include: {
              requestedBy: true,
              assignedTo: true,
              workflowSteps: {
                include: { approver: true },
                orderBy: { stepOrder: "asc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!q) {
        return null;
      }

      return {
        id: q.id,
        quotationNumber: q.quotationNumber,
        customerId: q.customerId,
        customer: {
          id: q.customer.id,
          customerNumber: q.customer.customerNumber,
          name: q.customer.name,
          externalAccountId: q.customer.externalAccountId,
          industry: q.customer.industry,
          city: q.customer.city,
          state: q.customer.state,
          tier: q.customer.tier,
          paymentTerms: q.customer.paymentTerms,
          creditLimit: q.customer.creditLimit ? Number(q.customer.creditLimit) : null,
          creditAvailable: q.customer.creditAvailable ? Number(q.customer.creditAvailable) : null,
          territory: q.customer.territory,
          contacts: q.customer.contacts?.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            title: c.title,
            phone: c.phone,
            isPrimary: c.isPrimary,
          })),
        },
        ownerId: q.ownerId,
        owner: {
          id: q.owner.id,
          name: q.owner.name,
          email: q.owner.email,
          role: q.owner.role,
          avatarUrl: q.owner.avatarUrl,
        },
        status: q.status,
        currentStage: q.currentStage,
        currency: q.currency,
        subtotal: Number(q.subtotal),
        discountTotal: Number(q.discountTotal),
        taxTotal: Number(q.taxTotal),
        totalValue: Number(q.totalValue),
        estimatedMargin: Number(q.estimatedMargin),
        riskScore: q.riskScore,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
        lineItems: q.lineItems.map(serializeQuoteLineItem),
        approvals: q.approvals.map((appr) => ({
          id: appr.id,
          status: appr.status,
          priority: appr.priority,
          currentStep: appr.currentStep,
          submittedAt: appr.submittedAt.toISOString(),
          requestedBy: {
            id: appr.requestedBy.id,
            name: appr.requestedBy.name,
            email: appr.requestedBy.email,
          },
          assignedTo: appr.assignedTo
            ? {
                id: appr.assignedTo.id,
                name: appr.assignedTo.name,
                email: appr.assignedTo.email,
              }
            : null,
          workflowSteps: appr.workflowSteps.map((st) => ({
            id: st.id,
            stepOrder: st.stepOrder,
            role: st.role,
            status: st.status,
            notes: st.notes,
            approver: st.approver
              ? {
                  id: st.approver.id,
                  name: st.approver.name,
                  email: st.approver.email,
                  role: st.approver.role,
                  avatarUrl: st.approver.avatarUrl,
                }
              : null,
          })),
        })),
      };
    } catch (error) {
      console.error(`[getQuotationWithLineItems] Database error for UUID "${identifier}":`, error);
      return null;
    }
  }

  // If not UUID and doesn't start with Q-, try quotationNumber case-insensitively
  try {
    return await getQuotationByNumber(identifier.toUpperCase());
  } catch {
    return null;
  }
}

