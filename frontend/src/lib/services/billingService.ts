import { prisma } from "@/lib/prisma";

export async function getBillingOverview() {
  const quotations = await prisma.quotation.findMany({
    include: {
      customer: true,
      lineItems: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const subscriptions = await prisma.subscription.findMany({
    include: {
      customer: true,
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Synthesize invoice view from real quotations and active subscriptions
  const invoices = quotations.map((q, idx) => {
    const total = Number(q.totalValue);
    const isPaid = q.status === "APPROVED";
    const paid = isPaid ? total : 0;
    const balanceDue = total - paid;
    const invStatus = isPaid ? "Paid" : q.status === "REJECTED" ? "Cancelled" : "Pending";

    return {
      id: `INV-${2000 + idx}`,
      customer: q.customer.name,
      quotationNumber: q.quotationNumber,
      source: "DealFlow360 Quotation",
      type: "One-Time",
      total,
      paid,
      balanceDue,
      status: invStatus,
      paymentTerms: q.customer.paymentTerms || "Net 30 Days",
      lineItems: q.lineItems.map((li) => ({
        id: li.id,
        sku: li.sku || "N/A",
        description: li.productName,
        quantity: li.quantity,
        unitPrice: Number(li.unitPrice),
        total: Number(li.lineTotal),
      })),
    };
  });

  // Add recurring invoices from subscriptions
  subscriptions.forEach((sub, idx) => {
    const total = Number(sub.mrr) * (sub.plan.interval === "ANNUAL" ? 12 : 1);
    invoices.push({
      id: `INV-SUB-${3000 + idx}`,
      customer: sub.customer.name,
      quotationNumber: `SUB-${sub.id.slice(0, 4).toUpperCase()}`,
      source: `Subscription · ${sub.plan.name}`,
      type: "Recurring",
      total,
      paid: total,
      balanceDue: 0,
      status: "Paid",
      paymentTerms: "Auto-Debit",
      lineItems: [
        {
          id: `sub-line-${idx}`,
          sku: sub.plan.code,
          description: `${sub.plan.name} (${sub.plan.interval})`,
          quantity: 1,
          unitPrice: Number(sub.plan.billingPrice),
          total,
        },
      ],
    });
  });

  return invoices;
}
