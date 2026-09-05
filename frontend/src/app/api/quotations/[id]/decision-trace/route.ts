import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    const quote = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: decodedId }, { quotationNumber: decodedId }],
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // 1. Try fetching from backend Decision Trace engine
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/quotations/${quote.id}/decision-trace?format=human`, {
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        const trace = await resp.json();
        if (trace && !trace.message) {
          return NextResponse.json(trace);
        }
      }
    } catch {
      // fallback to dynamic evaluation
    }

    // 2. Evaluate Rule Engine rules based on real quotation line items & customer tier
    const subtotal = Number(quote.subtotal);
    const discountTotal = Number(quote.discountTotal);
    const totalValue = Number(quote.totalValue);
    const margin = Number(quote.estimatedMargin);
    const avgDiscountPct = subtotal > 0 ? (discountTotal / subtotal) * 100 : 0;
    const tier = quote.customer.tier;

    // Allowed discount ceiling per tier: Platinum 25%, Gold 20%, Silver 15%, Bronze 10%
    const tierCeilings: Record<string, number> = {
      PLATINUM: 25,
      GOLD: 20,
      SILVER: 15,
      BRONZE: 10,
    };
    const maxAllowedDiscount = tierCeilings[tier] || 15;

    const maxLineDiscount = Math.max(
      0,
      ...quote.lineItems.map((li) => Number(li.discountPercent))
    );

    const discountCeilingPassed = maxLineDiscount <= maxAllowedDiscount;
    const marginPassed = margin >= 25.0; // minimum 25% margin target
    const categoryDiscountPassed = avgDiscountPct <= 18.0;
    const customerTierPassed = Number(quote.customer.creditAvailable) >= totalValue;
    const blendedRiskScore = quote.riskScore ?? (discountCeilingPassed && marginPassed ? 22 : 68);

    const entries = [
      {
        ruleId: "discount-ceiling",
        ruleName: "Discount Ceiling Governance",
        outcome: discountCeilingPassed ? "PASS" : "FAIL",
        severity: discountCeilingPassed ? "LOW" : "HIGH",
        computedValue: maxLineDiscount,
        threshold: maxAllowedDiscount,
        explanation: discountCeilingPassed
          ? `Maximum line discount of ${maxLineDiscount.toFixed(1)}% is compliant with the ${tier} customer ceiling of ${maxAllowedDiscount}%.`
          : `Line discount of ${maxLineDiscount.toFixed(1)}% exceeds the authorized ceiling of ${maxAllowedDiscount}% for tier ${tier}.`,
        evaluatedAt: new Date().toISOString(),
        inputs: {
          customerTier: tier,
          maxLineDiscount: `${maxLineDiscount}%`,
          allowedCeiling: `${maxAllowedDiscount}%`,
        },
        recommendation: discountCeilingPassed ? null : `Reduce top line discount to at or below ${maxAllowedDiscount}%.`,
      },
      {
        ruleId: "margin-floor",
        ruleName: "Commercial Margin Floor Rule",
        outcome: marginPassed ? "PASS" : margin >= 18 ? "WARN" : "FAIL",
        severity: marginPassed ? "LOW" : margin >= 18 ? "MEDIUM" : "CRITICAL",
        computedValue: margin,
        threshold: 25.0,
        explanation: marginPassed
          ? `Estimated margin of ${margin.toFixed(1)}% satisfies the commercial profitability requirement of ≥ 25.0%.`
          : `Estimated margin of ${margin.toFixed(1)}% is below the target 25.0% profitability standard.`,
        evaluatedAt: new Date().toISOString(),
        inputs: {
          estimatedMargin: `${margin.toFixed(1)}%`,
          minimumMargin: "25.0%",
          subtotal,
          totalValue,
        },
        recommendation: marginPassed ? null : "Increase quantities or adjust hardware discounting to recover margin.",
      },
      {
        ruleId: "customer-tier-credit",
        ruleName: "Customer Tier & Credit Exposure",
        outcome: customerTierPassed ? "PASS" : "WARN",
        severity: customerTierPassed ? "LOW" : "MEDIUM",
        computedValue: Number(quote.customer.creditAvailable),
        threshold: totalValue,
        explanation: customerTierPassed
          ? `Customer has available credit of ₹${quote.customer.creditAvailable.toLocaleString()} covering quotation value of ₹${totalValue.toLocaleString()}.`
          : `Quotation value of ₹${totalValue.toLocaleString()} exceeds available credit limit of ₹${quote.customer.creditAvailable.toLocaleString()}.`,
        evaluatedAt: new Date().toISOString(),
        inputs: {
          creditLimit: quote.customer.creditLimit,
          creditAvailable: quote.customer.creditAvailable,
          dealTotal: totalValue,
        },
        recommendation: customerTierPassed ? null : "Finance pre-payment or credit expansion approval required.",
      },
      {
        ruleId: "category-discount",
        ruleName: "Category Blended Discount Policy",
        outcome: categoryDiscountPassed ? "PASS" : "WARN",
        severity: categoryDiscountPassed ? "LOW" : "MEDIUM",
        computedValue: avgDiscountPct,
        threshold: 18.0,
        explanation: categoryDiscountPassed
          ? `Aggregate deal discount of ${avgDiscountPct.toFixed(1)}% is within standard commercial tolerances.`
          : `Aggregate deal discount of ${avgDiscountPct.toFixed(1)}% exceeds the 18.0% warning threshold.`,
        evaluatedAt: new Date().toISOString(),
        inputs: {
          blendedDiscountPercent: `${avgDiscountPct.toFixed(1)}%`,
          categoryThreshold: "18.0%",
        },
        recommendation: categoryDiscountPassed ? null : "Balance software and hardware line items.",
      },
      {
        ruleId: "blended-risk",
        ruleName: "Blended Composite Risk Scoring",
        outcome: blendedRiskScore <= 35 ? "PASS" : blendedRiskScore <= 70 ? "WARN" : "FAIL",
        severity: blendedRiskScore <= 35 ? "LOW" : blendedRiskScore <= 70 ? "HIGH" : "CRITICAL",
        computedValue: blendedRiskScore,
        threshold: 50.0,
        explanation: `Composite risk calculated at score ${blendedRiskScore}/100 considering discount exposure, customer tier, and deal magnitude.`,
        evaluatedAt: new Date().toISOString(),
        inputs: {
          riskScore: blendedRiskScore,
          dealValue: totalValue,
          marginPercent: margin,
        },
        recommendation: blendedRiskScore > 50 ? "Multi-level managerial sign-off will be mandated." : null,
      },
      {
        ruleId: "approval-routing",
        ruleName: "Approval Routing Engine",
        outcome: "PASS",
        severity: "LOW",
        computedValue: blendedRiskScore > 65 ? 2 : blendedRiskScore > 35 ? 1 : 0,
        threshold: 1,
        explanation:
          blendedRiskScore > 65
            ? "Requires Level 2 Finance & Director sign-off due to elevated risk and margin deviation."
            : blendedRiskScore > 35
            ? "Requires Level 1 Sales Manager review before quote dispatch."
            : "Eligible for Automatic Fast-Track Approval.",
        evaluatedAt: new Date().toISOString(),
        inputs: {
          routingStage: quote.currentStage || "Manager Review",
          mandatedLevel: blendedRiskScore > 65 ? "FINANCE" : blendedRiskScore > 35 ? "MANAGER" : "AUTO",
        },
        recommendation: null,
      },
    ];

    const passedCount = entries.filter((e) => e.outcome === "PASS").length;
    const warningCount = entries.filter((e) => e.outcome === "WARN").length;
    const failedCount = entries.filter((e) => e.outcome === "FAIL").length;

    let overallDecision: any = "AUTO_APPROVE";
    let approvalLevel: any = "AUTO";

    if (failedCount > 0 || blendedRiskScore > 65) {
      overallDecision = "PENDING_APPROVAL";
      approvalLevel = "FINANCE";
    } else if (warningCount > 0 || blendedRiskScore > 35) {
      overallDecision = "PENDING_APPROVAL";
      approvalLevel = "MANAGER";
    }

    const recommendations = entries
      .map((e) => e.recommendation)
      .filter((r): r is string => Boolean(r));

    return NextResponse.json({
      quotationId: quote.id,
      summary: {
        overallDecision,
        approvalLevel,
        riskScore: blendedRiskScore,
        totalRules: entries.length,
        passedCount,
        failedCount,
        warningCount,
        recommendations,
      },
      entries,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API decision-trace GET] Error:", error);
    return NextResponse.json({ error: "Failed to generate decision trace" }, { status: 500 });
  }
}
