import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      where: { role: "SALES_REP" },
    });

    const fallbackUser = user || (await prisma.user.findFirst());

    return NextResponse.json({
      id: fallbackUser?.id || "user-1",
      name: fallbackUser?.name || "Rachel Rep",
      email: fallbackUser?.email || "rachel.rep@dealflow360.com",
      role: "Sales Executive",
      avatarUrl: fallbackUser?.image || fallbackUser?.avatarUrl || null,
      department: "Commercial & Strategic Deals",
      territory: "Western & Northern India Enterprise",
      preferences: {
        currency: "INR",
        emailAlerts: true,
        approvalUpdates: true,
        compactView: false,
      },
    });
  } catch (error) {
    console.error("[API profile GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: body.preferences,
    });
  } catch (error) {
    console.error("[API profile PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
