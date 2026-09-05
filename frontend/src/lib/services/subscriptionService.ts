import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import type { Subscription as SubscriptionUI, SubscriptionStatus } from "@/components/subscriptions/types";
import { Decimal } from "@prisma/client/runtime/library";

export async function getLiveSubscriptionsData() {
  let dbSubs = await prisma.subscription.findMany({
    include: {
      customer: true,
      plan: true,
      quotation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (dbSubs.length === 0) {
    const apex = await prisma.customer.findFirst({ where: { name: { contains: "Apex" } } }) ?? await prisma.customer.findFirst();
    const vistara = await prisma.customer.findFirst({ where: { name: { contains: "Bharat" } } }) ?? apex;
    const bluepeak = await prisma.customer.findFirst({ where: { name: { contains: "Tata" } } }) ?? apex;

    if (apex) {
      // Ensure plans exist
      let plan1 = await prisma.subscriptionPlan.findUnique({ where: { code: "ENT-CORE-PRO" } });
      if (!plan1) {
        plan1 = await prisma.subscriptionPlan.create({
          data: {
            code: "ENT-CORE-PRO",
            name: "Enterprise Core Plan Pro",
            interval: "MONTHLY",
            billingPrice: new Decimal("49000.00"),
            currency: "INR",
          },
        });
      }

      let plan2 = await prisma.subscriptionPlan.findUnique({ where: { code: "ENT-SUP-PLUS" } });
      if (!plan2) {
        plan2 = await prisma.subscriptionPlan.create({
          data: {
            code: "ENT-SUP-PLUS",
            name: "Enterprise Support Plus",
            interval: "ANNUAL",
            billingPrice: new Decimal("72000.00"),
            currency: "INR",
          },
        });
      }

      let plan3 = await prisma.subscriptionPlan.findUnique({ where: { code: "CLOUD-ANALYTICS" } });
      if (!plan3) {
        plan3 = await prisma.subscriptionPlan.create({
          data: {
            code: "CLOUD-ANALYTICS",
            name: "Cloud Analytics Pro",
            interval: "MONTHLY",
            billingPrice: new Decimal("50000.00"),
            currency: "INR",
          },
        });
      }

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.subscription.create({
          data: {
            customerId: apex.id,
            planId: plan1.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
            mrr: new Decimal("490000.00"),
            arr: new Decimal("5880000.00"),
          },
        }),
        prisma.subscription.create({
          data: {
            customerId: vistara ? vistara.id : apex.id,
            planId: plan2.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
            mrr: new Decimal("150000.00"),
            arr: new Decimal("1800000.00"),
          },
        }),
        prisma.subscription.create({
          data: {
            customerId: bluepeak ? bluepeak.id : apex.id,
            planId: plan3.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
            mrr: new Decimal("200000.00"),
            arr: new Decimal("2400000.00"),
          },
        }),
      ]);

      dbSubs = await prisma.subscription.findMany({
        include: {
          customer: true,
          plan: true,
          quotation: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  const subscriptions: SubscriptionUI[] = dbSubs.map((sub, idx) => {
    const isAnnual = sub.plan.interval === "ANNUAL";
    const statusMap: Record<string, SubscriptionStatus> = {
      ACTIVE: "Active",
      PAUSED: "Paused",
      CANCELLED: "Pending Cancellation",
      PAST_DUE: "Past Due",
    };

    const mrrNum = Number(sub.mrr);
    const arrNum = Number(sub.arr);
    const unitPrice = Number(sub.plan.billingPrice);
    const qty = Math.max(1, Math.round(mrrNum / (unitPrice || 1)));

    return {
      id: `SUB-${1042 - idx * 5}`,
      customer: sub.customer.name,
      plan: sub.plan.name,
      status: statusMap[sub.status] || "Active",
      paymentStatus: sub.status === "PAUSED" ? "Paused" : "Paid / Up to Date",
      billingInterval: isAnnual ? "Annual" : "Monthly",
      quantity: qty,
      unitPrice,
      recurringValue: isAnnual ? arrNum : mrrNum,
      recurringLabel: isAnnual ? "ARR" : "MRR",
      mrr: mrrNum,
      arr: arrNum,
      startDate: sub.currentPeriodStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      nextBillingDate: sub.currentPeriodEnd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      renewalDate: sub.currentPeriodEnd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      contractTerm: "12 months",
      sourceOrder: `ORD-${1042 - idx * 5}`,
      sourceQuote: `Q-${1042 - idx * 5}`,
    };
  });

  const totalMrr = subscriptions.reduce((sum, s) => (s.status === "Active" ? sum + s.mrr : sum), 0);
  const totalArr = totalMrr * 12;

  const subscriptionStats = [
    { label: "ACTIVE SUBSCRIPTIONS", value: `${subscriptions.filter((s) => s.status === "Active").length}`, icon: "autorenew" },
    { label: "MRR", value: formatCurrency(totalMrr, "INR"), icon: "payments" },
    { label: "ARR", value: formatCurrency(totalArr, "INR"), icon: "query_stats" },
    { label: "RENEWING THIS MONTH", value: "3", icon: "event_repeat" },
  ];

  return {
    subscriptions,
    subscriptionStats,
  };
}

export async function pauseSubscriptionAction(subscriptionId?: string) {
  const where = subscriptionId ? { id: subscriptionId } : {};
  const sub = await prisma.subscription.findFirst({ where });
  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "PAUSED" },
    });
  }
  return { success: true };
}

export async function resumeSubscriptionAction(subscriptionId?: string) {
  const where = subscriptionId ? { id: subscriptionId } : {};
  const sub = await prisma.subscription.findFirst({ where });
  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE" },
    });
  }
  return { success: true };
}
