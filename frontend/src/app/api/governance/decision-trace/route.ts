import { NextRequest, NextResponse } from "next/server";
import { getDecisionTrace } from "@/lib/services/governanceBridge";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const quotationId = searchParams.get("quotationId");

  if (!quotationId) {
    return NextResponse.json({ error: "Missing quotationId query parameter" }, { status: 400 });
  }

  try {
    const trace = await getDecisionTrace(quotationId);
    return NextResponse.json(trace);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve decision trace" },
      { status: 500 }
    );
  }
}
