import { prisma } from "@/lib/prisma";

export interface CustomerLifetimeMargin {
  customerId: string;
  customerName: string;
  realizedHardwareRevenue: number;
  realizedHardwareMargin: number;
  realizedServiceRevenue: number;
  realizedServiceMargin: number;
  recurringSubscriptionMrr: number;
  projectedAnnualSubscriptionRevenue: number;
  projectedAnnualSubscriptionMargin: number;
  totalLifetimeRevenue: number;
  totalLifetimeMargin: number;
  lifetimeMarginPercentage: number;
}

export async function calculateCustomerLifetimeMargin(customerId: string): Promise<CustomerLifetimeMargin | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      quotations: {
        where: { status: "ACCEPTED" },
        include: {
          lineItems: { include: { product: true } },
        },
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        include: { plan: true },
      },
    },
  });

  if (!customer) return null;

  let hwRevenue = 0;
  let hwCost = 0;
  let srvRevenue = 0;
  let srvCost = 0;

  for (const q of customer.quotations) {
    for (const li of q.lineItems) {
      const lineTotal = Number(li.lineTotal);
      const isService = li.sku?.startsWith("SRV-") || li.productName.toLowerCase().includes("setup") || li.productName.toLowerCase().includes("migration");
      const costPrice = li.product ? Number(li.product.costPrice) : (isService ? lineTotal * 0.5 : lineTotal * 0.68);
      const totalLineCost = costPrice * li.quantity;

      if (isService) {
        srvRevenue += lineTotal;
        srvCost += totalLineCost;
      } else {
        hwRevenue += lineTotal;
        hwCost += totalLineCost;
      }
    }
  }

  const hwMargin = Math.max(0, hwRevenue - hwCost);
  const srvMargin = Math.max(0, srvRevenue - srvCost);

  let totalMrr = 0;
  for (const sub of customer.subscriptions) {
    totalMrr += Number(sub.mrr);
  }

  const annualSubRevenue = totalMrr * 12;
  // SaaS recurring subscriptions have ~85% gross margin
  const annualSubMargin = annualSubRevenue * 0.85;

  const totalLifetimeRevenue = hwRevenue + srvRevenue + annualSubRevenue;
  const totalLifetimeMargin = hwMargin + srvMargin + annualSubMargin;
  const lifetimeMarginPercentage = totalLifetimeRevenue > 0
    ? Number(((totalLifetimeMargin / totalLifetimeRevenue) * 100).toFixed(1))
    : 35.0;

  return {
    customerId: customer.id,
    customerName: customer.name,
    realizedHardwareRevenue: hwRevenue,
    realizedHardwareMargin: hwMargin,
    realizedServiceRevenue: srvRevenue,
    realizedServiceMargin: srvMargin,
    recurringSubscriptionMrr: totalMrr,
    projectedAnnualSubscriptionRevenue: annualSubRevenue,
    projectedAnnualSubscriptionMargin: annualSubMargin,
    totalLifetimeRevenue,
    totalLifetimeMargin,
    lifetimeMarginPercentage,
  };
}
