export type SubscriptionStatus = "Active" | "Past Due" | "Pending Cancellation" | "Paused";
export type BillingInterval = "Monthly" | "Quarterly" | "Yearly" | "Annual";
export type PaymentStatus = "Paid / Up to Date" | "Past Due" | "Paused";
export type BillingEventStatus = "Completed" | "Upcoming" | "Scheduled";

export interface SubscriptionPlan {
  id: string;
  name: string;
  unitPrice: number;
}

export interface Subscription {
  id: string;
  customer: string;
  plan: string;
  status: SubscriptionStatus;
  paymentStatus: PaymentStatus;
  billingInterval: BillingInterval;
  quantity: number;
  unitPrice: number;
  recurringValue: number;
  recurringLabel: string;
  mrr: number;
  arr: number;
  startDate: string;
  nextBillingDate: string;
  renewalDate: string;
  contractTerm: string;
  sourceOrder: string;
  sourceQuote: string;
}

export interface BillingEvent {
  id: string;
  date: string;
  label: string;
  amount: number;
  status: BillingEventStatus;
}

export interface InvoicePreview {
  id: string;
  date: string;
  amount: number;
  status: string;
}

export interface SubscriptionChange {
  currentQuantity: number;
  requestedQuantity: number;
  currentMonthlyAmount: number;
  newMonthlyAmount: number;
  estimatedProratedAdjustment: number;
}
