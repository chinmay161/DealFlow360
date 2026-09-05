import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      service: "dealflow360-api",
      database: "connected",
      timestamp,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "degraded",
        service: "dealflow360-api",
        database: "disconnected",
        timestamp,
      },
      { status: 503 }
    );
  }
}
