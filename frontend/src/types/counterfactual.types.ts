export interface CounterfactualLineChange {
  lineItemId?: string;
  productName: string;
  field: "discountPercent" | "quantity" | "unitPrice";
  currentValue: number;
  proposedValue: number;
  displayChange: string; // e.g. "18% ↓ 12%"
}

export interface CounterfactualRecommendation {
  id: string;
  title: string;
  description: string;
  changes: CounterfactualLineChange[];
  expectedResult: "Auto Approval" | "Manager Only" | "Finance Only";
  revenueImpact: number; // e.g. -1250 (in INR/USD)
  revenueImpactFormatted: string; // e.g. "-₹1,250"
  projectedRiskScore: number;
  currentRiskScore: number;
  feasibilityScore: number;
}

export interface GenerateRecommendationsResponse {
  quotationId: string;
  currentDecision: string;
  recommendations: CounterfactualRecommendation[];
  simulationsCount: number;
  executionTimeMs: number;
  evaluatedAt: string;
}

export interface SimulationRequest {
  quotationId: string;
  changes: Array<{
    lineItemId: string;
    discountPercent?: number;
    quantity?: number;
    unitPrice?: number;
  }>;
}

export interface SimulationResult {
  success: boolean;
  projectedDecision: string;
  projectedRiskScore: number;
  projectedMargin: number;
  revenueDelta: number;
  rulesPassed: string[];
  rulesTriggered: string[];
}
