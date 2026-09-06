import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
      include: {
        lineItems: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const ts = (targetState || "").toUpperCase();
    const isProgressing =
      ts.includes("SUBMIT") ||
      ts.includes("PENDING") ||
      ts.includes("REVIEW") ||
      ts.includes("APPROV");

    if (isProgressing && (!quote.lineItems || quote.lineItems.length === 0)) {
      return NextResponse.json(
        {
          error: "A quotation must contain at least one product.",
          message: "A quotation must contain at least one product.",
        },
        { status: 400 }
      );
    }

    const session = await auth();
    const actorId = body.actorId || session?.user?.id || quote.ownerId;

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

    if (backendSuccess) {
      const refreshed = await prisma.quotation.findUnique({
        where: { id: quote.id },
      });
      if (refreshed) {
        return NextResponse.json({
          success: true,
          newState: refreshed.status,
          currentStage: refreshed.currentStage,
          quotationNumber: refreshed.quotationNumber,
          backendSynced: true,
          details: backendResponse,
        });
      }
    }

    // 2. Canonical local fallback when backend is offline
    const cleanTarget = (targetState || "").toUpperCase().replace(/[\s_-]+/g, "");
    const { evaluateQuotationRules } = await import("@/lib/services/governanceBridge");
    const evalResult = await evaluateQuotationRules(quote.id).catch(() => null);

    let mappedStatus: any = "DRAFT";
    let targetStage = targetState;

    if (cleanTarget === "APPROVED") {
      // Direct transition to APPROVED requires zero rule failures and complete approvals
      if (evalResult && (!evalResult.approved || evalResult.rules?.some((r: any) => r.outcome === "FAIL"))) {
        return NextResponse.json(
          {
            error: "Quotation cannot be approved: mandatory governance rules report exceptions.",
            decision: "PENDING APPROVAL",
            riskScore: evalResult.overallRiskScore,
          },
          { status: 409 }
        );
      }

      const pendingApproval = await prisma.approval.findFirst({
        where: { quotationId: quote.id, status: "PENDING" },
        include: { workflowSteps: true },
      });

      if (pendingApproval && pendingApproval.workflowSteps.some((s: any) => s.status === "PENDING" || s.status === "IN_PROGRESS")) {
        return NextResponse.json(
          { error: "Quotation cannot be approved: required workflow approval steps are still pending." },
          { status: 409 }
        );
      }

      mappedStatus = "APPROVED";
      targetStage = "Approved";
    } else if (cleanTarget.includes("REJECT")) {
      mappedStatus = "REJECTED";
      targetStage = "Rejected";
    } else if (
      cleanTarget.includes("PENDING") ||
      cleanTarget.includes("REVIEW") ||
      cleanTarget.includes("SUBMIT")
    ) {
      // Submission for review: determine if eligible for fast-track auto-approval
      const hasViolations = evalResult && (!evalResult.approved || evalResult.rules?.some((r: any) => r.outcome === "FAIL"));
      const isHighRisk = (evalResult?.overallRiskScore ?? quote.riskScore ?? 50) > 65;

      if (!hasViolations && evalResult?.overallRiskScore != null && evalResult.overallRiskScore <= 30 && cleanTarget.includes("AUTO")) {
        mappedStatus = "APPROVED";
        targetStage = "Approved";
      } else {
        mappedStatus = "IN_REVIEW";
        targetStage = isHighRisk ? "Finance Review" : "Manager Approval";
      }
    } else if (cleanTarget.includes("CANCEL")) {
      mappedStatus = "CANCELLED";
      targetStage = "Cancelled";
    } else if (cleanTarget.includes("DRAFT")) {
      mappedStatus = "DRAFT";
      targetStage = "Drafting";
    }

    // 3. Update quotation status & record transition history
    const updated = await prisma.quotation.update({
      where: { id: quote.id },
      data: {
        status: mappedStatus,
        currentStage: targetStage,
        riskScore: evalResult?.overallRiskScore ?? quote.riskScore ?? undefined,
      },
    });

    // 4. Create or update approval record and workflow steps if in review
    if (mappedStatus === "IN_REVIEW" || mappedStatus === "PENDING_APPROVAL") {
      const { submitQuoteForApproval } = await import("@/lib/services/approvalService");
      await submitQuoteForApproval(quote.id, reason || "Submitted for approval review").catch(() => null);
    } else if (mappedStatus === "APPROVED") {
      await prisma.approval.updateMany({
        where: { quotationId: quote.id, status: "PENDING" },
        data: { status: "APPROVED", resolvedAt: new Date() },
      });
    }

    // Record approval history record if user exists
    if (actorId) {
      const user = await prisma.user.findUnique({ where: { id: actorId } });
      if (user) {
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
            message: reason || `State transitioned from ${quote.status} to ${targetStage}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      newState: updated.status,
      currentStage: updated.currentStage,
      quotationNumber: updated.quotationNumber,
      backendSynced: backendSuccess,
      details: backendResponse,
    });
  } catch (error) {
    console.error("[API transition POST] Error:", error);
    return NextResponse.json({ error: "Failed to transition quotation state" }, { status: 500 });
  }
}
