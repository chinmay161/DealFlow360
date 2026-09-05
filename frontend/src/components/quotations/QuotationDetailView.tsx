"use client";

import React, { useState } from "react";
import { SerializedQuotationDetail } from "@/lib/quotations";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";
import { CustomerSummary } from "@/components/CustomerSummary";
import { QuoteLineItemsTable } from "@/components/QuoteLineItemsTable";
import { RecommendationSection } from "@/components/RecommendationSection";
import { DealIntelligenceRow } from "@/components/DealIntelligenceRow";
import { QuoteActionBar } from "@/components/QuoteActionBar";
import { CounterfactualCard } from "@/components/quotations/CounterfactualCard";
import { DecisionTraceModal } from "@/components/quotations/DecisionTraceModal";

import { formatCurrency } from "@/lib/currency";

interface QuotationDetailViewProps {
  quotation: SerializedQuotationDetail;
}

export const QuotationDetailView: React.FC<QuotationDetailViewProps> = ({ quotation }) => {
  const [isDecisionTraceOpen, setIsDecisionTraceOpen] = useState(false);

  const customerTier = quotation.customer.tier
    ? `${quotation.customer.tier.charAt(0).toUpperCase()}${quotation.customer.tier.slice(1).toLowerCase()} Tier`
    : "Commercial Tier";

  const priceList = quotation.customer.tier
    ? `${quotation.customer.tier.toUpperCase()} Commercial Rate Card (${quotation.currency})`
    : `Standard Commercial Price List (${quotation.currency})`;

  const primaryContact =
    quotation.customer.contacts?.find((c) => c.isPrimary) ||
    quotation.customer.contacts?.[0] ||
    null;

  const creditLine = quotation.customer.creditLimit
    ? `Credit Limit: ${formatCurrency(quotation.customer.creditLimit, quotation.currency)} Active`
    : "Credit Line: Commercial Account";

  const territory = quotation.customer.territory
    ? `Territory: ${quotation.customer.territory}`
    : "Territory: PAN-India Enterprise";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* SCROLLABLE WORKSPACE */}
      <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-32">
        <WorkspaceHeader
          quotationNumber={quotation.quotationNumber}
          customerTier={customerTier}
          priceList={priceList}
          revisionText="Active Commercial Version"
        />

        <CustomerSummary
          quotationId={quotation.id}
          customer={quotation.customer}
          owner={quotation.owner}
          buyerContact={
            primaryContact
              ? {
                  name: primaryContact.name,
                  title: primaryContact.title || "Commercial Contact",
                  email: primaryContact.email,
                }
              : null
          }
          paymentTerms={quotation.customer.paymentTerms || "Net 30 Days"}
          creditLine={creditLine}
          territory={territory}
        />

        <QuoteLineItemsTable
          quotationId={quotation.id}
          lineItems={quotation.lineItems}
          currency={quotation.currency}
        />

        <RecommendationSection quotationId={quotation.id} />

        {/* Counterfactual Margin Optimization Engine */}
        <CounterfactualCard quotationId={quotation.id} />

        <DealIntelligenceRow
          currency={quotation.currency}
          subtotal={quotation.subtotal}
          discountTotal={quotation.discountTotal}
          taxTotal={quotation.taxTotal}
          totalValue={quotation.totalValue}
          estimatedMargin={quotation.estimatedMargin}
          riskScore={quotation.riskScore}
          lineItems={quotation.lineItems}
          approvals={quotation.approvals}
        />
      </div>

      {/* BOTTOM ELEVATED ACTION BAR */}
      <QuoteActionBar
        quotation={quotation}
        totalValue={quotation.totalValue}
        currency={quotation.currency}
        status={quotation.status}
        onOpenDecisionTrace={() => setIsDecisionTraceOpen(true)}
      />

      {/* DECISION TRACE MODAL */}
      <DecisionTraceModal
        quotationId={quotation.id}
        quotationNumber={quotation.quotationNumber}
        isOpen={isDecisionTraceOpen}
        onClose={() => setIsDecisionTraceOpen(false)}
      />
    </div>
  );
};

