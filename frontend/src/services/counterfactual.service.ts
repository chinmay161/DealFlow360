import { apiClient } from "./api-client";
import type {
  GenerateRecommendationsResponse,
  SimulationRequest,
  SimulationResult,
} from "@/types/counterfactual.types";

export const counterfactualService = {
  /**
   * Fetch counterfactual recommendations for a quotation
   */
  async getRecommendations(quotationId: string): Promise<GenerateRecommendationsResponse> {
    return apiClient<GenerateRecommendationsResponse>(
      `/api/quotations/${encodeURIComponent(quotationId)}/recommendations`
    );
  },

  /**
   * Simulate proposed modifications in real time
   */
  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    return apiClient<SimulationResult>("/api/recommendations/simulate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};
