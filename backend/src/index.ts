import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createDecisionTraceRouter } from "./modules/decision-trace/index.js";
import { createApprovalRouter } from "./modules/approval-routing/index.js";
import { createCounterfactualRouter } from "./modules/counterfactual/index.js";
import { createQuotationStateRouter } from "./modules/quotation-state/index.js";
import { createConfigurationRouter } from "./modules/configuration/index.js";
import { auditMiddleware, createAuditRouter } from "./modules/audit/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(auditMiddleware());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "dealflow360-backend",
    timestamp: new Date().toISOString()
  });
});

// ── Module routers ───────────────────────────────────────────────────────────
app.use(createDecisionTraceRouter());
app.use(createApprovalRouter());
app.use(createCounterfactualRouter());
app.use(createQuotationStateRouter());
app.use(createConfigurationRouter());
app.use(createAuditRouter());

app.listen(PORT, () => {
  console.log(`[DealFlow360 Backend] Server running on http://localhost:${PORT}`);
});
