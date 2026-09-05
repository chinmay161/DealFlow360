/**
 * Counterfactual Engine Module — Barrel Export
 *
 * Single entry point for consumers:
 *
 *   import {
 *     CounterfactualEngine,
 *     createCounterfactualRouter,
 *   } from "./modules/counterfactual";
 */

// ── Services ─────────────────────────────────────────────────────────────────
export { CounterfactualEngine } from "./services/CounterfactualEngine.js";
export { SimulationEngine } from "./services/SimulationEngine.js";
export { RecommendationGenerator } from "./services/RecommendationGenerator.js";
export { RecommendationRanker } from "./services/RecommendationRanker.js";
export { CostEvaluator } from "./services/CostEvaluator.js";
export { RecommendationFormatter } from "./services/RecommendationFormatter.js";

// ── Controller & Router ──────────────────────────────────────────────────────
export { CounterfactualController } from "./controllers/CounterfactualController.js";
export { createCounterfactualRouter } from "./routes/routes.js";

// ── Types ────────────────────────────────────────────────────────────────────
export {
  RecommendationType,
} from "./types/types.js";
export type {
  CandidateChange,
  CandidateModification,
  SimulationChangeItem,
  ApprovalLevel,
} from "./types/types.js";

// ── Interfaces ───────────────────────────────────────────────────────────────
export type {
  Recommendation,
  SimulationResult,
  GenerateRecommendationsResponse,
  SimulateRecommendationPayload,
  SimulationResponse,
} from "./interfaces/interfaces.js";

// ── DTOs ─────────────────────────────────────────────────────────────────────
export {
  QuotationIdParamSchema,
  SimulationChangeItemSchema,
  SimulateRecommendationSchema,
} from "./dto/dto.js";
export type {
  QuotationIdParamDto,
  SimulationChangeItemDto,
  SimulateRecommendationDto,
} from "./dto/dto.js";

// ── Errors ───────────────────────────────────────────────────────────────────
export {
  CounterfactualError,
  QuotationNotFoundError,
  InvalidSimulationError,
} from "./utils/errors.js";

// ── Utilities ────────────────────────────────────────────────────────────────
export {
  cloneRuleContext,
  applyModificationsToContext,
} from "./utils/clone.js";
