import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/services/currentUserService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.roleDisplay,
      title: currentUser.title,
      avatarUrl: currentUser.image,
      department: currentUser.department,
      territory: currentUser.territory,
      preferences: currentUser.preferences,
    });
  } catch (error) {
    console.error("[API profile GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updatedPreferences = {
      ...currentUser.preferences,
      ...(body.preferences || {}),
    };

    // Persist to PostgreSQL User record
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        preferences: updatedPreferences,
        ...(body.territory ? { territory: body.territory } : {}),
        ...(body.department ? { department: body.department } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error("[API profile PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
