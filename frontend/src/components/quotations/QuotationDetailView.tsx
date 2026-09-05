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
import { QueryProvider } from "@/components/providers/QueryProvider";
import {
  QuotationInventoryWidget,
  RuleEngineInventoryStatusWidget,
  FulfillmentTimeline,
  ReservationStatusCard,
  ShipmentStatusCard,
  WarehouseComparison,
} from "@/features/inventory/components";

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

        {/* Live Regional Inventory & Availability Visibility */}
        <QueryProvider>
          {/* 6-Stage Quotation to Shipment Fulfillment Stepper */}
          <FulfillmentTimeline
            currentStage={
              quotation.status === "APPROVED"
                ? "RESERVED"
                : quotation.status === "SENT"
                ? "APPROVED"
                : "SUBMITTED"
            }
          />

          {/* Quotation Line Stock Breakdown */}
          <QuotationInventoryWidget
            quotationId={quotation.id}
            quotationNumber={quotation.quotationNumber}
            lineItems={quotation.lineItems}
          />

          {/* Operational Reservation & Consignment Tracking Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-base">
            <ReservationStatusCard
              data={{
                quotationNumber: quotation.quotationNumber,
                warehouseName: "Mumbai Central Hub (WH-BOM)",
                status: quotation.status === "APPROVED" || quotation.status === "ACCEPTED" ? "RESERVED" : "PENDING",
                reservedQuantity: quotation.lineItems.reduce((sum, li) => sum + li.quantity, 0),
                reservedAt: "Upon quotation approval",
                expiresAt: "7 days from reservation",
              }}
            />
            <ShipmentStatusCard
              data={{
                shipmentNumber: `SHP-${quotation.quotationNumber.replace("Q-", "") || "1048"}`,
                carrier: "BlueDart Enterprise Express",
                trackingNumber: `BD-${quotation.id.slice(0, 8).toUpperCase()}`,
                status: quotation.status === "ACCEPTED" ? "SHIPPED" : "PACKED",
                estimatedDelivery: "Tomorrow by 2:00 PM",
                originWarehouse: "Mumbai Central Hub",
              }}
            />
          </div>

          {/* Rule Engine Inventory Validation & Governance */}
          <RuleEngineInventoryStatusWidget
            quotationId={quotation.id}
            quotationNumber={quotation.quotationNumber}
          />

          {/* Regional Network Capacity Comparison */}
          <WarehouseComparison
            warehouses={[
              {
                id: "wh-1",
                name: "Mumbai Central Hub",
                code: "WH-BOM",
                location: "Bhiwandi, Maharashtra",
                capacity: 10000,
                availableStock: 7420,
                reservedStock: 1850,
                utilizationRate: 74.2,
                leadTimeDays: 1,
                status: "ACTIVE",
              },
              {
                id: "wh-2",
                name: "Bengaluru South Hub",
                code: "WH-BLR",
                location: "Whitefield, Karnataka",
                capacity: 8500,
                availableStock: 5900,
                reservedStock: 1100,
                utilizationRate: 69.4,
                leadTimeDays: 1,
                status: "ACTIVE",
              },
              {
                id: "wh-3",
                name: "Delhi North Hub",
                code: "WH-DEL",
                location: "Gurugram, Haryana",
                capacity: 6000,
                availableStock: 5200,
                reservedStock: 950,
                utilizationRate: 86.6,
                leadTimeDays: 2,
                status: "ACTIVE",
              },
            ]}
          />
        </QueryProvider>

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

