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

interface QuotationDetailViewProps {
  quotation: SerializedQuotationDetail;
}

export const QuotationDetailView: React.FC<QuotationDetailViewProps> = ({ quotation }) => {
  const [isDecisionTraceOpen, setIsDecisionTraceOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* SCROLLABLE WORKSPACE */}
      <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-32">
        <WorkspaceHeader
          quotationNumber={quotation.quotationNumber}
          customerTier={
            quotation.customer.industry?.includes("Enterprise")
              ? "Gold Tier"
              : "Standard Tier"
          }
          priceList="Gold Preferred India 2026"
          revisionText="Revision History (v3)"
        />

        <CustomerSummary
          quotationId={quotation.id}
          customer={quotation.customer}
          owner={quotation.owner}
          buyerContact={
            quotation.customer.name === "Apex Infotech Pvt. Ltd."
              ? {
                  name: "Ananya Shah",
                  title: "VP Procurement",
                  email: "ananya.shah@apexinfotech.example",
                }
              : null
          }
          paymentTerms="Net 45 Days"
          creditLine="Credit Line: ₹25,00,000.00 Active"
          territory="Territory: South India (Bengaluru)"
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

