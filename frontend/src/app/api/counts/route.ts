import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [quotesCount, pendingApprovalsCount] = await Promise.all([
      prisma.quotation.count(),
      prisma.approval.count({ where: { status: "PENDING" } }),
    ]);
    return NextResponse.json({ quotesCount, pendingApprovalsCount });
  } catch {
    return NextResponse.json({ quotesCount: 0, pendingApprovalsCount: 0 });
  }
}
