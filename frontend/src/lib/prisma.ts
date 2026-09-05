import path from "path";
import dotenv from "dotenv";

// Ensure root .env.local is loaded
dotenv.config({ path: path.resolve(process.cwd(), "../.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
