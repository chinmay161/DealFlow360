import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

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

app.listen(PORT, () => {
  console.log(`[DealFlow360 Backend] Server running on http://localhost:${PORT}`);
});
