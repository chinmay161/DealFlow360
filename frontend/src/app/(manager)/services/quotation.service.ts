import { apiClient } from "@/services/api-client";
import type { QuotationReviewDetails } from "../types/manager.types";

export const managerQuotationService = {
  /**
   * Fetch full quotation review details including rule trace, counterfactuals, and timeline
   */
  async getQuotationReviewDetails(id: string): Promise<QuotationReviewDetails> {
    const encodedId = encodeURIComponent(id);

    // Run parallel calls to all backend engine endpoints
    const [quoteData, traceData, recData, historyData, workflowData] = await Promise.all([
      apiClient<any>(`/api/quotations/${encodedId}`).catch((err) => {
        console.error("Failed to load quote base:", err);
        return null;
      }),
      apiClient<any>(`/api/quotations/${encodedId}/decision-trace`).catch((err) => {
        console.error("Failed to load decision trace:", err);
        return null;
      }),
      apiClient<any>(`/api/quotations/${encodedId}/recommendations`).catch((err) => {
        console.error("Failed to load recommendations:", err);
        return null;
      }),
      apiClient<any[]>(`/api/quotations/${encodedId}/history`).catch((err) => {
        console.error("Failed to load history:", err);
        return [];
      }),
      apiClient<any>(`/api/approvals/quotation/${encodedId}`).catch((err) => {
        console.error("Failed to load workflow steps:", err);
        return null;
      }),
    ]);

    if (!quoteData) {
      throw new Error(`Quotation ${id} could not be loaded.`);
    }

    const subtotal = Number(quoteData.subtotal || 0);
    const discountTotal = Number(quoteData.discountTotal || 0);
    const taxTotal = Number(quoteData.taxTotal || 0);
    const estimatedMargin = Number(quoteData.estimatedMargin || 25);
    const totalValue = Number(quoteData.totalValue || 0);
    const marginAmount = Math.round(totalValue * (estimatedMargin / 100));

    const lineItems = (quoteData.lineItems || []).map((li: any) => ({
      id: li.id,
      sku: li.sku || "SKU-PROD",
      productName: li.productName || "Enterprise Product",
      category: li.category || "Hardware & Software",
      quantity: li.quantity || 1,
      unitPrice: Number(li.unitPrice || 0),
      discountPercent: Number(li.discountPercent || 0),
      marginPercent: Number(li.marginPercent || 25),
      totalAmount: Number(li.totalPrice || li.unitPrice * li.quantity * (1 - (li.discountPercent || 0) / 100)),
    }));

    const ruleResults = {
      overallDecision: traceData?.summary?.overallDecision || (quoteData.riskScore > 35 ? "PENDING_APPROVAL" : "AUTO_APPROVE"),
      approvalLevel: traceData?.summary?.approvalLevel || (quoteData.riskScore > 65 ? "FINANCE" : "MANAGER"),
      riskScore: quoteData.riskScore ?? traceData?.summary?.riskScore ?? 45,
      rulesPassed: traceData?.summary?.passedCount ?? 4,
      rulesFailed: traceData?.summary?.failedCount ?? 1,
      rulesWarning: traceData?.summary?.warningCount ?? 1,
      recommendations: traceData?.summary?.recommendations || [],
      evaluatedAt: traceData?.evaluatedAt || new Date().toISOString(),
    };

    const decisionTrace = (traceData?.entries || []).map((entry: any) => ({
      ruleId: entry.ruleId,
      ruleName: entry.ruleName,
      outcome: entry.outcome,
      severity: entry.severity,
      computedValue: entry.computedValue,
      threshold: entry.threshold,
      explanation: entry.explanation,
      evaluatedAt: entry.evaluatedAt || new Date().toISOString(),
      inputs: entry.inputs || {},
      recommendation: entry.recommendation,
    }));

    const counterfactuals = (recData?.recommendations || []).map((rec: any) => ({
      id: rec.id,
      title: rec.title,
      description: rec.description,
      changes: rec.changes || [],
      expectedResult: rec.expectedResult || "Auto Approval",
      revenueImpact: rec.revenueImpact ?? 0,
      revenueImpactFormatted: rec.revenueImpactFormatted || `₹${rec.revenueImpact}`,
      projectedRiskScore: rec.projectedRiskScore ?? 20,
      currentRiskScore: rec.currentRiskScore ?? (quoteData.riskScore || 55),
      feasibilityScore: rec.feasibilityScore ?? 85,
    }));

    const approvalHistory = (workflowData?.steps || []).map((step: any) => ({
      stage: step.stage,
      role: step.stepName || step.approverRole,
      approverName: step.approverName || "Designated Reviewer",
      status: step.status,
      decidedAt: step.decidedAt,
      comments: step.comments,
    }));

    const auditTimeline = (historyData || []).map((h: any, idx: number) => ({
      id: h.id || `hist-${idx}`,
      time: h.createdAt || new Date().toISOString(),
      title: h.toState ? `State changed to ${h.toState}` : `Quotation Event`,
      description: h.reason || `Action recorded in quotation lifecycle.`,
      actor: h.actorName || "Sales Operator",
      role: h.actorRole || "Operations",
      type: h.toState || "EVENT",
    }));

    return {
      id: quoteData.id,
      quotationNumber: quoteData.quotationNumber,
      status: quoteData.status,
      currentStage: quoteData.currentStage || "Manager Review",
      riskScore: quoteData.riskScore ?? 45,
      createdAt: quoteData.createdAt,
      updatedAt: quoteData.updatedAt,
      customer: {
        id: quoteData.customer?.id || "",
        name: quoteData.customer?.name || "Corporate Customer",
        customerNumber: quoteData.customer?.customerNumber,
        tier: quoteData.customer?.tier || "SILVER",
        industry: quoteData.customer?.industry || "Technology",
        creditLimit: Number(quoteData.customer?.creditLimit || 5000000),
        creditAvailable: Number(quoteData.customer?.creditAvailable || 3500000),
        paymentTerms: quoteData.customer?.paymentTerms || "Net 30 Days",
      },
      owner: {
        id: quoteData.owner?.id || "",
        name: quoteData.owner?.name || "Sales Executive",
        email: quoteData.owner?.email || "sales@dealflow360.in",
        role: quoteData.owner?.role || "SALES_REP",
      },
      financials: {
        subtotal,
        discountTotal,
        taxTotal,
        estimatedMargin,
        marginAmount,
        totalValue,
      },
      lineItems,
      ruleResults,
      decisionTrace,
      counterfactuals,
      approvalHistory,
      auditTimeline,
    };
  },
};
