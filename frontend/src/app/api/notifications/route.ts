import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getAuthoritativeCustomerForSession } from "@/lib/services/portalAuthService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user;

    const where: any = {};
    if (currentUser?.role === "CUSTOMER") {
      const authCustomer = await getAuthoritativeCustomerForSession(currentUser);
      where.customerId = authCustomer?.id || currentUser.customerId;
    } else if (currentUser?.role === "SALES_REP" && currentUser.id) {
      where.OR = [
        { customer: { ownerId: currentUser.id } },
        { customer: { ownerId: null }, ownerId: currentUser.id },
      ];
    }

    const quotes = await prisma.quotation.findMany({
      where,
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { customer: { select: { name: true } } },
    });

    const items = quotes.map((q, i) => {
      let category: any = "QUOTATION_APPROVED";
      let title = `Quotation #${q.quotationNumber} Approved`;
      let message = `Customer ${q.customer.name} quotation has been formally approved.`;

      if (q.status === "DRAFT") {
        category = "QUOTATION_CREATED";
        title = `New Quotation Draft #${q.quotationNumber}`;
        message = `Customer ${q.customer.name} created quotation #${q.quotationNumber}.`;
      } else if (q.status === "REJECTED") {
        category = "QUOTATION_REJECTED";
        title = `Quotation #${q.quotationNumber} Rejected`;
        message = `Margin tolerance exceeded for ${q.customer.name}.`;
      } else if (q.status === "IN_REVIEW") {
        category = "APPROVAL_REQUESTED";
        title = `Approval Pending for #${q.quotationNumber}`;
        message = `Awaiting Manager review (Risk Score ${q.riskScore ?? 62}/100).`;
      } else if (i === 1) {
        category = "MANAGER_COMMENT";
        title = `Manager Feedback on #${q.quotationNumber}`;
        message = `Commercial Approver: "Please verify warranty bundle pricing."`;
      } else if (i === 2) {
        category = "QUOTATION_RETURNED";
        title = `Quotation #${q.quotationNumber} Returned for Revision`;
        message = `Finance requested discount reduction to auto-clear.`;
      }

      return {
        id: `notif-${q.id}-${i}`,
        category,
        title,
        message,
        quotationId: q.id,
        quotationNumber: q.quotationNumber,
        read: i >= 2,
        createdAt: q.updatedAt.toISOString(),
      };
    });

    const unreadCount = items.filter((n) => !n.read).length;

    return NextResponse.json({
      items,
      unreadCount,
    });
  } catch (error) {
    console.error("[API notifications GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
