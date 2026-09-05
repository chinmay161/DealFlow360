import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { bootstrapRules, createRuleEngineRouter } from "./modules/rule-engine/index.js";
import { createDecisionTraceRouter } from "./modules/decision-trace/index.js";
import { createApprovalRouter } from "./modules/approval-routing/index.js";
import { createCounterfactualRouter } from "./modules/counterfactual/index.js";
import { createQuotationStateRouter } from "./modules/quotation-state/index.js";
import { createConfigurationRouter } from "./modules/configuration/index.js";
import { auditMiddleware, createAuditRouter } from "./modules/audit/index.js";
import { authenticateInternalOrBearer } from "./middleware/auth.js";

dotenv.config();

// Initialize all rules in the RuleRegistry
bootstrapRules();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(auditMiddleware());

// Public health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "dealflow360-backend",
    timestamp: new Date().toISOString(),
  });
});

// ── Authentication & Security Guard for API ─────────────────────────────────
app.use("/api/v1", authenticateInternalOrBearer);

// ── Module routers ───────────────────────────────────────────────────────────
app.use(createRuleEngineRouter());
app.use(createDecisionTraceRouter());
app.use(createApprovalRouter());
app.use(createCounterfactualRouter());
app.use(createQuotationStateRouter());
app.use(createConfigurationRouter());
app.use(createAuditRouter());

app.listen(PORT, () => {
  console.log(`[DealFlow360 Backend] Server running on http://localhost:${PORT}`);
});

