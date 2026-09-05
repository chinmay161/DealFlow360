import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient — reused across the entire application lifetime.
// In serverless environments, store the instance on `globalThis` to survive
// hot-reloads without leaking connections.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
