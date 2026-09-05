export type QuotationStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type CustomerTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface Customer {
  id: string;
  name: string;
  industry?: string | null;
  tier: CustomerTier;
  paymentTerms?: string | null;
  creditLimit: number;
  creditAvailable: number;
  territory?: string | null;
  ownerId?: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  unit: string;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface QuoteLineItem {
  id: string;
  quotationId: string;
  productId?: string | null;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountLimitPercent?: number | null;
  estimatedMarginPercent?: number | null;
  lineTotal: number;
  governanceStatus?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product | null;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer: Customer;
  ownerId: string;
  owner?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  status: QuotationStatus;
  currentStage?: string | null;
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalValue: number;
  estimatedMargin: number;
  riskScore: number | null;
  createdAt: string;
  updatedAt: string;
  lineItems: QuoteLineItem[];
  approvals?: ApprovalSummary[];
}

export interface ApprovalSummary {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  workflowSteps?: Array<{
    id: string;
    stepOrder: number;
    stepName: string;
    status: string;
    approver?: {
      name?: string | null;
      email: string;
    } | null;
    decidedAt?: string | null;
    comments?: string | null;
  }>;
}

export interface QuotationListResponse {
  quotations: Quotation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QuotationFilterParams {
  search?: string;
  status?: QuotationStatus | "ALL";
  riskLevel?: "ALL" | "LOW" | "MEDIUM" | "HIGH";
  sortBy?: "date" | "amount" | "riskScore" | "quoteNumber";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CreateQuotationInput {
  customerId: string;
  currency?: string;
  lineItems: Array<{
    productId?: string;
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
  }>;
  notes?: string;
}
