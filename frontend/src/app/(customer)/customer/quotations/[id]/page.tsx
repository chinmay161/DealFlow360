"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useQuotationDetail } from "@/hooks/useQuotationDetail";
import { useDecisionTrace } from "@/hooks/useDecisionTrace";
import { useCounterfactual } from "@/hooks/useCounterfactual";
import { useApprovalWorkflow } from "@/hooks/useApprovalWorkflow";
import { QuotationHeader } from "@/features/quotations/details/QuotationHeader";
import { CustomerInfoCard } from "@/features/quotations/details/CustomerInfoCard";
import { ProductTableCard } from "@/features/quotations/details/ProductTableCard";
import { FinancialBreakdownCard } from "@/features/quotations/details/FinancialBreakdownCard";
import { RuleEngineCard } from "@/features/quotations/details/RuleEngineCard";
import { DecisionTraceTimeline } from "@/features/quotations/details/DecisionTraceTimeline";
import { CounterfactualCard } from "@/features/quotations/details/CounterfactualCard";
import { ApprovalTimelineCard } from "@/features/quotations/details/ApprovalTimelineCard";
import { EmptyState } from "@/components/EmptyState";

export default function QuotationDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const { data: quotation, isLoading, isError, refetch } = useQuotationDetail(id);
  const { data: traceData, isLoading: isTraceLoading } = useDecisionTrace(id);
  const { data: counterfactualData, isLoading: isCFLoading } = useCounterfactual(id);
  const { data: workflowData, isLoading: isWorkflowLoading } = useApprovalWorkflow(id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="h-28 w-full bg-slate-200 rounded-xl" />
        <div className="h-64 w-full bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (isError || !quotation) {
    return (
      <div className="py-16">
        <EmptyState
          title="Quotation Not Found"
          description={`Unable to locate quotation #${id} in PostgreSQL. Please check the quotation identifier.`}
          actionLabel="Return to Quotations Directory"
          onAction={() => (window.location.href = "/quotations")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/customer/dashboard" className="hover:text-slate-700 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer/quotations" className="hover:text-slate-700 transition-colors">
            Quotations
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
            #{quotation.quotationNumber}
          </span>
        </div>

        <Link
          href="/customer/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Directory
        </Link>
      </div>

      {/* 1. Header (Quote number, status, risk, approval badge, actions) */}
      <QuotationHeader quotation={quotation} onRefresh={() => refetch()} />

      {/* 2. Customer Information Card */}
      <CustomerInfoCard customer={quotation.customer} />

      {/* 3. Product Table (Editable if Draft) */}
      <ProductTableCard
        quotationId={quotation.id}
        lineItems={quotation.lineItems}
        isDraft={quotation.status === "DRAFT"}
        onRefresh={() => refetch()}
      />

      {/* 4. Financial Summary Breakdown */}
      <FinancialBreakdownCard quotation={quotation} />

      {/* 5. Rule Engine Result (Decision, Risk Score, Rules Passed, Rules Failed) */}
      <RuleEngineCard summary={traceData?.summary} isLoading={isTraceLoading} />

      {/* 6. Decision Trace Timeline (Expandable Input, Threshold, Computed Value, Explanation, Outcome) */}
      <DecisionTraceTimeline entries={traceData?.entries || []} isLoading={isTraceLoading} />

      {/* 7. Counterfactual Recommendations (What-If, Apply Preview) */}
      <CounterfactualCard
        recommendations={counterfactualData?.recommendations || []}
        isLoading={isCFLoading}
      />

      {/* 8. Approval Workflow Progression Timeline */}
      <ApprovalTimelineCard workflow={workflowData} isLoading={isWorkflowLoading} />
    </div>
  );
}
