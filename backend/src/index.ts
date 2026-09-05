import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createDecisionTraceRouter } from "./modules/decision-trace/index.js";
import { createApprovalRouter } from "./modules/approval-routing/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`[DealFlow360 Backend] Server running on http://localhost:${PORT}`);
});
