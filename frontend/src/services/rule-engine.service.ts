import { apiClient } from "./api-client";
import type { DecisionTraceResponse } from "@/types/decision-trace.types";

export const ruleEngineService = {
  /**
   * Get decision trace evaluation for a quotation
   */
  async getDecisionTrace(quotationId: string): Promise<DecisionTraceResponse> {
    return apiClient<DecisionTraceResponse>(`/api/quotations/${encodeURIComponent(quotationId)}/decision-trace`);
  },

  /**
   * Trigger direct export of decision trace as JSON or CSV
   */
  async exportDecisionTrace(quotationId: string, format: "json" | "csv" = "json"): Promise<Blob | string> {
    return apiClient<string>(`/api/quotations/${encodeURIComponent(quotationId)}/decision-trace/export`, {
      params: { format },
    });
  },
};
