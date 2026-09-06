import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import type { ApprovalItem } from "@/app/(manager)/types/manager.types";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Manager authorization required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const riskFilter = searchParams.get("risk");
    const statusFilter = searchParams.get("status");
    const priorityFilter = searchParams.get("priority");
    const sortBy = searchParams.get("sortBy") || "submittedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const approvals = await prisma.approval.findMany({
      include: {
        quotation: {
          include: {
            customer: true,
            owner: true,
            lineItems: true,
          },
        },
        requestedBy: true,
        assignedTo: true,
        workflowSteps: {
          include: { approver: true },
          orderBy: { stepOrder: "asc" },
        },
        history: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    let items: ApprovalItem[] = approvals.map((appr) => {
      const q = appr.quotation;
      const totalVal = Number(q.totalValue);
      const subtotal = Number(q.subtotal);
      const discount = Number(q.discountTotal);
      const tax = Number(q.taxTotal);
      const margin = Number(q.estimatedMargin);
      const risk = q.riskScore ?? 45;

      const riskCategory: "High" | "Medium" | "Low" =
        risk >= 70 ? "High" : risk >= 40 ? "Medium" : "Low";

      const priority: "High" | "Medium" | "Low" =
        appr.priority === "HIGH" || appr.priority === "URGENT" || risk >= 70
          ? "High"
          : appr.priority === "MEDIUM"
          ? "Medium"
          : "Low";

      const status =
        appr.status === "APPROVED"
          ? "Approved"
          : appr.status === "REJECTED"
          ? "Rejected"
          : appr.status === "CANCELLED"
          ? "Changes Requested"
          : "Pending";

      const reasons = q.lineItems
        .filter(
          (li) =>
            li.discountLimitPercent &&
            Number(li.discountPercent) > Number(li.discountLimitPercent)
        )
        .map((li, idx) => ({
          id: `reason-${li.id}-${idx}`,
          title: `${li.productName || "Line Item"} Discount Concession`,
          requestedValue: `${Number(li.discountPercent)}%`,
          allowedLimit: `${Number(li.discountLimitPercent)}%`,
          exceptionText: `Discount of ${Number(li.discountPercent)}% exceeds delegated limit of ${Number(li.discountLimitPercent)}%`,
          severity: (Number(li.discountPercent) > 20 ? "high" : "warning") as "high" | "warning",
        }));

      if (reasons.length === 0) {
        reasons.push({
          id: `default-${appr.id}`,
          title: "Manager Authority Review",
          requestedValue: formatCurrency(totalVal, "INR"),
          allowedLimit: "₹25,00,000",
          exceptionText: "Standard commercial review required for account tier.",
          severity: "warning",
        });
      }

      const submittedDate = new Date(appr.submittedAt);
      const hoursAgo = Math.max(1, Math.round((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60)));
      const submittedTimeAgo =
        hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.round(hoursAgo / 24)}d ago`;

      return {
        id: appr.id,
        dealId: q.quotationNumber,
        quotationNumber: q.quotationNumber,
        customer: q.customer.name,
        customerTier: q.customer.tier,
        customerGlobalId: q.customer.externalAccountId || undefined,
        salesExecutive: {
          name: appr.requestedBy.name || appr.requestedBy.email.split("@")[0],
          email: appr.requestedBy.email,
        },
        amount: totalVal,
        formattedAmount: formatCurrency(totalVal, "INR"),
        riskScore: risk,
        riskCategory,
        approvalLevel: q.currentStage || "Sales Management",
        currentStage: q.currentStage || "Manager Review",
        submittedAt: appr.submittedAt.toISOString(),
        submittedTimeAgo,
        status: status as any,
        priority,
        reasons,
        financials: {
          subtotal: formatCurrency(subtotal, "INR"),
          discount: `-${formatCurrency(discount, "INR")}`,
          estimatedTax: formatCurrency(tax, "INR"),
          netTotal: formatCurrency(totalVal, "INR"),
          estMargin: formatCurrency(Math.round(totalVal * (margin / 100)), "INR"),
          marginPercentage: `${margin.toFixed(0)}%`,
        },
        workflow: appr.workflowSteps.map((s) => ({
          stepNumber: s.stepOrder,
          role: s.role,
          assignee: s.approver?.name || s.role,
          status: (s.status === "APPROVED" ? "Completed" : s.status === "IN_PROGRESS" ? "Current" : "Pending") as any,
          statusLabel: s.status === "APPROVED" ? "Approved" : s.status === "IN_PROGRESS" ? "In Progress" : "Pending",
          delegatedLimitOrTrigger: s.notes || undefined,
          completedAt: s.completedAt?.toISOString(),
          notes: s.notes || undefined,
        })),
        history: appr.history.map((h) => ({
          id: h.id,
          time: h.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          description: h.message || h.eventType,
          actor: h.actor?.name || h.actor?.email?.split("@")[0] || "System",
        })),
        lineItemsCount: q.lineItems.length,
        quoteUrl: `/manager/quotation/${q.quotationNumber}`,
      };
    });

    // Apply filtering
    if (search) {
      items = items.filter(
        (i) =>
          i.quotationNumber.toLowerCase().includes(search) ||
          i.customer.toLowerCase().includes(search) ||
          i.salesExecutive.name.toLowerCase().includes(search) ||
          i.salesExecutive.email.toLowerCase().includes(search)
      );
    }

    if (riskFilter && riskFilter !== "ALL") {
      items = items.filter((i) => i.riskCategory.toUpperCase() === riskFilter.toUpperCase());
    }

    if (statusFilter && statusFilter !== "ALL") {
      items = items.filter((i) => i.status.toUpperCase() === statusFilter.toUpperCase());
    }

    if (priorityFilter && priorityFilter !== "ALL") {
      items = items.filter((i) => i.priority.toUpperCase() === priorityFilter.toUpperCase());
    }

    // Apply sorting
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "riskScore") {
        comparison = a.riskScore - b.riskScore;
      } else if (sortBy === "quotationNumber") {
        comparison = a.quotationNumber.localeCompare(b.quotationNumber);
      } else {
        comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return NextResponse.json({
      items,
      totalCount: items.length,
    });
  } catch (error) {
    console.error("[API manager/approvals GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch approvals queue" }, { status: 500 });
  }
}
