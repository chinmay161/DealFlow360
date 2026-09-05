/**
 * Rule Engine — Routes
 *
 * Exposes on-demand rule evaluation for quotations.
 *
 * Endpoints:
 *   POST /api/v1/rules/evaluate
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { RuleEngine } from "../engine/RuleEngine.js";
import { prisma } from "../../../lib/prisma.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("rule-engine-routes");

const EvaluateRequestSchema = z.object({
  quotationId: z.string().uuid("quotationId must be a valid UUID"),
  persistTrace: z.boolean().optional().default(true),
});

export function createRuleEngineRouter(customEngine?: RuleEngine): Router {
  const router = Router();
  const engine = customEngine ?? new RuleEngine(prisma);

  router.post("/api/v1/rules/evaluate", async (req: Request, res: Response) => {
    try {
      const parsed = EvaluateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid request payload",
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { quotationId, persistTrace } = parsed.data;
      const result = await engine.evaluate(quotationId, { persistTrace });

      log.info(
        { quotationId, approved: result.approved, riskScore: result.overallRiskScore },
        "Rule evaluation completed via API",
      );

      res.status(200).json(result);
    } catch (error: any) {
      log.error({ error, body: req.body }, "Error in rule evaluation endpoint");
      res.status(500).json({
        error: error.message || "Internal server error evaluating rules",
      });
    }
  });

  return router;
}
