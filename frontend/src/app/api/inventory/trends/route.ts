import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("range") || "30D"; // 7D, 30D, 90D

    const stockTrend = [
      { date: "Day 1", onHand: 2450, available: 2150, reserved: 300 },
      { date: "Day 5", onHand: 2420, available: 2080, reserved: 340 },
      { date: "Day 10", onHand: 2380, available: 2010, reserved: 370 },
      { date: "Day 15", onHand: 2510, available: 2100, reserved: 410 },
      { date: "Day 20", onHand: 2480, available: 2040, reserved: 440 },
      { date: "Day 25", onHand: 2420, available: 1960, reserved: 460 },
      { date: "Day 30", onHand: 2390, available: 1890, reserved: 500 },
    ];

    const reservationTrend = [
      { date: "Wk 1", confirmed: 140, fulfilled: 95, pending: 30 },
      { date: "Wk 2", confirmed: 195, fulfilled: 130, pending: 45 },
      { date: "Wk 3", confirmed: 240, fulfilled: 175, pending: 55 },
      { date: "Wk 4", confirmed: 290, fulfilled: 215, pending: 65 },
    ];

    const shipmentTrend = [
      { date: "Wk 1", delivered: 42, inTransit: 18, planned: 12 },
      { date: "Wk 2", delivered: 56, inTransit: 24, planned: 15 },
      { date: "Wk 3", delivered: 71, inTransit: 29, planned: 19 },
      { date: "Wk 4", delivered: 88, inTransit: 35, planned: 22 },
    ];

    const categoryTrend = [
      { date: "Month 1", hardware: 1200, peripherals: 850, accessories: 400 },
      { date: "Month 2", hardware: 1150, peripherals: 920, accessories: 420 },
      { date: "Month 3", hardware: 1080, peripherals: 990, accessories: 450 },
    ];

    return NextResponse.json({
      timeRange,
      stockTrend,
      reservationTrend,
      shipmentTrend,
      categoryTrend,
    });
  } catch (error) {
    console.error("[API /api/inventory/trends] Error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory trends" }, { status: 500 });
  }
}
