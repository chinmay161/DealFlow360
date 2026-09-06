"use client";

import React, { useState } from "react";
import { Bookmark, Truck } from "lucide-react";
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
  ShipmentTimeline,
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

  const isApproved =
    quotation.status === "APPROVED" ||
    quotation.status === "ACCEPTED" ||
    quotation.status === "SENT";

  const allReservations = [
    ...(quotation.reservations || []),
    ...(quotation.orders?.flatMap((o) => o.reservations || []) || []),
  ];
  const hasReservation =
    allReservations.length > 0 ||
    Boolean(quotation.currentStage?.toLowerCase().includes("reserved"));
  const primaryReservation = allReservations[0];

  const allShipments = quotation.orders?.flatMap((o) => o.shipments || []) || [];
  const primaryShipment = allShipments[0];
  const shipmentStatus = primaryShipment?.status || null;

  const isPacked =
    isApproved &&
    hasReservation &&
    (shipmentStatus === "PACKED" ||
      shipmentStatus === "SHIPPED" ||
      shipmentStatus === "IN_TRANSIT" ||
      shipmentStatus === "DELIVERED");

  const isDispatched =
    isPacked &&
    (shipmentStatus === "SHIPPED" ||
      shipmentStatus === "IN_TRANSIT" ||
      shipmentStatus === "DELIVERED");

  const isDelivered = isDispatched && shipmentStatus === "DELIVERED";

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
              isDelivered
                ? "DELIVERED"
                : isDispatched
                ? "SHIPPED"
                : isPacked
                ? "PACKED"
                : hasReservation
                ? "RESERVED"
                : isApproved
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
            {/* Dedicated Reservation Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Reservation
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    hasReservation
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : isApproved
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {hasReservation ? "Reserved" : isApproved ? "Awaiting Allocation" : "Pending Approval"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Warehouse
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {primaryReservation?.warehouseName || (isApproved ? "Mumbai Central Hub" : "Pending Assignment")}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 block">
                    {primaryReservation?.warehouseCode || (isApproved ? "WH-BOM" : "WH-TBD")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Reserved
                  </span>
                  <span className="font-mono font-bold text-sm text-blue-700">
                    {hasReservation
                      ? `${allReservations.reduce((sum, r) => sum + r.quantity, 0) || quotation.lineItems.reduce((sum, li) => sum + li.quantity, 0)} Units`
                      : "0 Units"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {hasReservation ? "Committed Stock" : isApproved ? "Awaiting Lock" : "Not Allocated"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Status
                  </span>
                  <span
                    className={`font-semibold text-sm ${
                      hasReservation
                        ? "text-emerald-700"
                        : isApproved
                        ? "text-amber-700"
                        : "text-slate-500"
                    }`}
                  >
                    {hasReservation ? "Reserved" : isApproved ? "Pending Reservation" : "Pending Approval"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {hasReservation ? "Active Allocation" : isApproved ? "Ready for Stock Lock" : "Review Required"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dedicated Shipment Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Shipment
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    primaryShipment
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : isPacked
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : hasReservation
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {primaryShipment?.status || (isPacked ? "Packed" : hasReservation ? "Awaiting Packing" : "Pending Approval")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Shipment
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {primaryShipment?.shipmentNumber || (hasReservation ? `SHP-${quotation.quotationNumber.replace(/[^0-9]/g, "") || "10042"}` : "Not Dispatched")}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {primaryShipment?.carrier || (isApproved ? "BlueDart Express" : "Logistics Partner")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Status
                  </span>
                  <span
                    className={`font-semibold text-sm ${
                      primaryShipment || isPacked
                        ? "text-purple-700"
                        : hasReservation
                        ? "text-amber-700"
                        : "text-slate-500"
                    }`}
                  >
                    {primaryShipment?.status || (isPacked ? "Packed" : hasReservation ? "Awaiting Packing" : "Pending Approval")}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {primaryShipment || isPacked
                      ? "Consignment Sealed"
                      : hasReservation
                      ? "Stock Locked / Staging"
                      : "Awaiting Clearance"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Expected Delivery
                  </span>
                  <span className="font-semibold text-blue-700 text-sm">
                    {primaryShipment?.deliveredAt
                      ? "Delivered"
                      : primaryShipment?.shippedAt
                      ? "In Transit"
                      : isApproved
                      ? "Post-Dispatch"
                      : "Post-Approval"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {primaryShipment?.trackingCode ? `Track: ${primaryShipment.trackingCode}` : "Estimated 1-2 Days"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Beautiful Vertical Shipment Lifecycle Timeline */}
          <ShipmentTimeline
            quotationNumber={quotation.quotationNumber}
            shipmentNumber={primaryShipment?.shipmentNumber}
            quotationStatus={quotation.status}
            hasApprovals={quotation.approvals && quotation.approvals.length > 0}
            hasReservation={hasReservation}
            shipmentStatus={shipmentStatus}
            createdAt={quotation.createdAt}
            approvedAt={
              quotation.approvals?.find((a) => a.status === "APPROVED")?.submittedAt ||
              (isApproved ? quotation.updatedAt : null)
            }
            reservedAt={primaryReservation?.createdAt}
            packedAt={primaryShipment?.createdAt}
            shippedAt={primaryShipment?.shippedAt}
            deliveredAt={primaryShipment?.deliveredAt}
          />

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

