import { NextRequest, NextResponse } from "next/server";
import { getCounterfactualRecommendations } from "@/lib/services/governanceBridge";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const quotationId = searchParams.get("quotationId");

  if (!quotationId) {
    return NextResponse.json({ error: "Missing quotationId query parameter" }, { status: 400 });
  }

  try {
    const recs = await getCounterfactualRecommendations(quotationId);
    return NextResponse.json(recs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve recommendations" },
      { status: 500 }
    );
  }
}
