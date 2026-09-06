"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuotationReview } from "../../../hooks/useQuotationReview";
import { QuoteSummarySection } from "../../../features/review/QuoteSummarySection";
import { ProductTableSection } from "../../../features/review/ProductTableSection";
import { FinancialSummarySection } from "../../../features/review/FinancialSummarySection";
import { DecisionCard } from "../../../components/DecisionCard";
import { DecisionTraceSection } from "../../../features/review/DecisionTraceSection";
import { CounterfactualSection } from "../../../features/review/CounterfactualSection";
import { Timeline } from "../../../components/Timeline";
import { AuditTimeline } from "../../../components/AuditTimeline";
import { ApprovalActions } from "../../../components/ApprovalActions";
import { SkeletonCard, SkeletonTable } from "../../../components/LoadingSkeletons";
import { EmptyState } from "../../../components/EmptyState";
import {
  ChevronLeft,
  History,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface QuotationReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function QuotationReviewPage({ params }: QuotationReviewPageProps) {
  const resolvedParams = use(params);
  const quotationId = resolvedParams.id;

  const { data: quote, isLoading, isError, refetch } = useQuotationReview(quotationId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
        <SkeletonCard count={2} />
        <SkeletonTable rows={4} columns={7} />
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="space-y-6">
        <Link
          href="/manager/approvals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Approval Queue</span>
        </Link>
        <EmptyState
          title="Quotation Not Found"
          description={`Unable to retrieve commercial quotation details for #${quotationId}.`}
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-12">
      {/* Back to Queue Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/manager/approvals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Approval Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Commercial Review Mode</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary">
            Level 1 Authority
          </span>
        </div>
      </div>

      {/* 1. Quote Summary Section */}
      <QuoteSummarySection details={quote} />

      {/* 2 & 3. Product Line Items Table & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-base items-start">
        <div className="lg:col-span-8">
          <ProductTableSection items={quote.lineItems} />
        </div>

        <div className="lg:col-span-4">
          <FinancialSummarySection
            subtotal={quote.financials.subtotal}
            discountTotal={quote.financials.discountTotal}
            taxTotal={quote.financials.taxTotal}
            estimatedMargin={quote.financials.estimatedMargin}
            marginAmount={quote.financials.marginAmount}
            totalValue={quote.financials.totalValue}
          />
        </div>
      </div>

      {/* 4. Rule Engine Result Card */}
      <DecisionCard
        overallDecision={quote.ruleResults.overallDecision}
        approvalLevel={quote.ruleResults.approvalLevel}
        riskScore={quote.ruleResults.riskScore}
        rulesPassed={quote.ruleResults.rulesPassed}
        rulesFailed={quote.ruleResults.rulesFailed}
        rulesWarning={quote.ruleResults.rulesWarning}
        recommendations={quote.ruleResults.recommendations}
      />

      {/* 5. Interactive Decision Trace Timeline */}
      <DecisionTraceSection entries={quote.decisionTrace} />

      {/* 6. Counterfactual Engine Recommendations */}
      {quote.counterfactuals && quote.counterfactuals.length > 0 && (
        <CounterfactualSection recommendations={quote.counterfactuals} />
      )}

      {/* 7 & 8. Approval History Timeline & Audit Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-base items-start">
        {/* 7. Approval History Timeline */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="font-title-md text-sm font-bold text-on-surface">
                Approval Workflow History
              </h3>
            </div>
            <span className="text-[11px] text-outline font-medium">Stage progression</span>
          </div>

          <Timeline steps={quote.approvalHistory} />
        </div>

        {/* 8. Audit Timeline */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="font-title-md text-sm font-bold text-on-surface">
                Quotation Audit Timeline
              </h3>
            </div>
            <span className="text-[11px] text-outline font-medium">Lifecycle events</span>
          </div>

          <AuditTimeline events={quote.auditTimeline} />
        </div>
      </div>

      {/* 9. Sticky Approval Action Bar */}
      <ApprovalActions
        approvalId={quote.id}
        quotationNumber={quote.quotationNumber}
        totalAmount={formatCurrency(quote.financials.totalValue, "INR")}
        customerName={quote.customer.name}
        status={quote.status}
        canAct={quote.status !== "APPROVED" && quote.status !== "REJECTED"}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
