/**
 * Counterfactual Engine — Core Interfaces
 */

import type { RuleEngineResult, ApprovalLevel } from "../../rule-engine/interfaces/Rule.js";
import type { RuleContext } from "../../rule-engine/engine/RuleContext.js";
import type {
  RecommendationType,
  CandidateChange,
  CandidateModification,
  SimulationChangeItem,
} from "../types/types.js";

/**
 * Output recommendation model conforming to API requirements.
 */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: RecommendationType;
  affectedLines: Array<string | number>;
  changes: CandidateChange[];
  currentValues: Record<string, unknown>;
  recommendedValues: Record<string, unknown>;
  expectedDecision: string;
  expectedApprovalLevel: ApprovalLevel;
  expectedRiskScore: number;
  estimatedRevenueImpact: number;
  estimatedMarginImpact: number;
  confidence: number;
  priority: number;
}

/**
 * Detailed simulation evaluation result produced by SimulationEngine and CostEvaluator.
 */
export interface SimulationResult {
  /** Whether the simulation succeeded in passing or meeting approval objectives */
  success: boolean;
  /** The candidate proposal evaluated */
  candidate: CandidateModification;
  /** The RuleEngineResult returned by the simulated evaluation */
  simulatedResult: RuleEngineResult;
  /** Evaluated composite cost score (lower = better) */
  costScore: number;
  /** Estimated impact on grand total / revenue (simulated - original) */
  revenueImpact: number;
  /** Estimated impact on blended margin (simulated - original) */
  marginImpact: number;
  /** Estimated approval likelihood (0.0 to 1.0) */
  approvalProbability: number;
  /** Resulting overall risk score (0 to 100) */
  riskScore: number;
  /** Number of modified quotation lines */
  changedLinesCount: number;
  /** Cloned in-memory context reflecting simulated changes */
  simulatedContext: RuleContext;
}

/**
 * Response returned by GET /api/v1/quotations/:quotationId/recommendations
 */
export interface GenerateRecommendationsResponse {
  quotationId: string;
  currentDecision: string;
  recommendations: Recommendation[];
  simulationsCount?: number;
  executionTimeMs?: number;
  evaluatedAt?: string;
}

/**
 * Request payload for POST /api/v1/recommendations/simulate
 */
export interface SimulateRecommendationPayload {
  quotationId: string;
  changes: SimulationChangeItem[];
}

/**
 * Response for POST /api/v1/recommendations/simulate
 */
export interface SimulationResponse {
  quotationId: string;
  simulatedDecision: string;
  simulatedApprovalLevel: ApprovalLevel;
  simulatedRiskScore: number;
  approved: boolean;
  ruleEngineResult: RuleEngineResult;
  revenueImpact: number;
  marginImpact: number;
  executionTimeMs: number;
}
