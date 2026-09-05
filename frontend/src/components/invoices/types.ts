export type InvoiceStatus = "Paid" | "Pending" | "Past Due" | "Partially Paid" | "Cancelled";
export type InvoiceType = "One-Time" | "Recurring" | "Credit Note";
export type DateRange = "This Week" | "This Month" | "Last Month";
export type PaymentMethod = "Bank Transfer" | "Credit Card" | "Other";
export type InvoiceEventTone = "success" | "info" | "warning" | "danger" | "neutral";

export interface Invoice {
  id: string;
  customer: string;
  type: InvoiceType;
  source: string;
  sourceQuote: string;
  sourceOrder: string;
  sourceSubscription?: string;
  description: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balanceDue: number;
  status: InvoiceStatus;
  dateRange: DateRange;
  billingPeriod?: { start: string; end: string };
  nextInvoice?: string;
  plan?: string;
  billingInterval?: string;
  currentMrr?: number;
}

export interface InvoiceLineItem {
  invoiceId: string;
  description: string;
  quantity: string;
  unitPrice: number;
  billing?: string;
  amount: number;
}

export interface Payment {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  recordedAt: string;
}

export interface CreditNote {
  invoiceId: string;
  reason: string;
  amount: number;
}

export interface InvoiceEvent {
  invoiceId: string;
  date: string;
  label: string;
  tone: InvoiceEventTone;
}
