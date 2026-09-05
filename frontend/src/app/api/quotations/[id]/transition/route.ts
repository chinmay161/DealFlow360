import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const body = await req.json();
    const { targetState, reason, metadata } = body;

    const quote = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: decodedId }, { quotationNumber: decodedId }],
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const defaultActor = await prisma.user.findFirst();
    const actorId = body.actorId || defaultActor?.id || quote.ownerId;

    // 1. Attempt transition via Backend State Machine microservice
    let backendSuccess = false;
    let backendResponse: any = null;

    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/quotations/${quote.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetState,
          actorId,
          reason,
          metadata,
        }),
      });

      if (resp.ok) {
        backendResponse = await resp.json();
        backendSuccess = true;
      } else {
        console.warn("[transition] Backend state machine returned status:", resp.status);
      }
    } catch (backendErr) {
      console.warn("[transition] Backend state machine not reachable, executing local transition:", backendErr);
    }

    // 2. Map targetState to QuotationStatus
    let mappedStatus: any = "DRAFT";
    const ts = targetState.toUpperCase();
    if (ts.includes("APPROV")) mappedStatus = "APPROVED";
    else if (ts.includes("REJECT")) mappedStatus = "REJECTED";
    else if (ts.includes("PENDING") || ts.includes("REVIEW")) mappedStatus = "IN_REVIEW";
    else if (ts.includes("CANCEL")) mappedStatus = "EXPIRED";

    // 3. Update quotation status & record transition history
    const updated = await prisma.quotation.update({
      where: { id: quote.id },
      data: {
        status: mappedStatus,
        currentStage: targetState,
      },
    });

    // Record approval history record if user exists
    if (actorId) {
      const user = await prisma.user.findUnique({ where: { id: actorId } });
      if (user) {
        // Find or create approval container
        let approval = await prisma.approval.findFirst({ where: { quotationId: quote.id } });
        if (!approval) {
          approval = await prisma.approval.create({
            data: {
              quotationId: quote.id,
              requestedById: quote.ownerId,
              status: mappedStatus === "APPROVED" ? "APPROVED" : "PENDING",
            },
          });
        }

        await prisma.approvalHistory.create({
          data: {
            approvalId: approval.id,
            actorId: user.id,
            eventType: mappedStatus === "APPROVED" ? "APPROVED" : "SUBMITTED",
            message: reason || `State transitioned from ${quote.status} to ${targetState}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      newState: updated.status,
      quotationNumber: updated.quotationNumber,
      backendSynced: backendSuccess,
      details: backendResponse,
    });
  } catch (error) {
    console.error("[API transition POST] Error:", error);
    return NextResponse.json({ error: "Failed to transition quotation state" }, { status: 500 });
  }
}
