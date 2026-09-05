import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { formatCurrency } from "@/lib/currency";

export interface InvoiceItem {
  id: string;
  customer: string;
  type: "One-Time" | "Recurring" | "Credit Note";
  source: string;
  sourceQuote: string;
  sourceOrder: string;
  sourceSubscription?: string;
  description: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balanceDue: number;
  status: "Paid" | "Pending" | "Past Due" | "Partially Paid" | "Cancelled";
  dateRange: "This Week" | "This Month" | "Last Month";
  billingPeriod?: { start: string; end: string };
  nextInvoice?: string;
  plan?: string;
  billingInterval?: string;
  currentMrr?: number;
}

export async function getLiveInvoicesData() {
  // Check if invoices exist in DB, if not seed initial canonical ones
  let dbInvoices = await prisma.invoice.findMany({
    include: {
      customer: true,
      order: true,
      quotation: true,
      lines: true,
      payments: true,
      creditNotes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (dbInvoices.length === 0) {
    const apex = await prisma.customer.findFirst({ where: { name: { contains: "Apex" } } }) ?? await prisma.customer.findFirst();
    const novabyte = await prisma.customer.findFirst({ where: { name: { contains: "NovaByte" } } }) ?? apex;
    const bharat = await prisma.customer.findFirst({ where: { name: { contains: "Bharat" } } }) ?? apex;

    const dueIn15 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    if (apex) {
      await prisma.$transaction([
        prisma.invoice.create({
          data: {
            invoiceNumber: "INV-2042",
            customerId: apex.id,
            status: InvoiceStatus.SENT,
            dueDate: dueIn15,
            subtotal: new Decimal("490000.00"),
            taxAmount: new Decimal("88200.00"),
            totalAmount: new Decimal("578200.00"),
            paidAmount: new Decimal("0.00"),
            balanceDue: new Decimal("578200.00"),
            paymentTerms: "Net 15 Days",
            lines: {
              create: [
                { sku: "SUB-CORE-PRO", description: "Enterprise Core Plan Pro - 10 seats", quantity: 1, unitPrice: new Decimal("490000.00"), lineTotal: new Decimal("490000.00") }
              ]
            }
          }
        }),
        prisma.invoice.create({
          data: {
            invoiceNumber: "INV-2038",
            customerId: apex.id,
            status: InvoiceStatus.PAID,
            dueDate: dueIn15,
            subtotal: new Decimal("1340000.00"),
            taxAmount: new Decimal("241200.00"),
            totalAmount: new Decimal("1581200.00"),
            paidAmount: new Decimal("1581200.00"),
            balanceDue: new Decimal("0.00"),
            paymentTerms: "Net 15 Days",
            lines: {
              create: [
                { sku: "HW-BUNDLE-01", description: "Laptop Pro 14 x 10 + Studio Display x 5 + Enterprise Setup", quantity: 15, unitPrice: new Decimal("89333.33"), lineTotal: new Decimal("1340000.00") }
              ]
            }
          }
        }),
        prisma.invoice.create({
          data: {
            invoiceNumber: "INV-2031",
            customerId: novabyte ? novabyte.id : apex.id,
            status: InvoiceStatus.PAID,
            dueDate: dueIn15,
            subtotal: new Decimal("1636364.00"),
            taxAmount: new Decimal("294545.00"),
            totalAmount: new Decimal("1930909.00"),
            paidAmount: new Decimal("1930909.00"),
            balanceDue: new Decimal("0.00"),
            paymentTerms: "Net 15 Days",
            lines: {
              create: [
                { sku: "SRV-SUP-ANN", description: "Enterprise Support Plus - Annual", quantity: 1, unitPrice: new Decimal("1636364.00"), lineTotal: new Decimal("1636364.00") }
              ]
            }
          }
        }),
        prisma.invoice.create({
          data: {
            invoiceNumber: "INV-2027",
            customerId: bharat ? bharat.id : apex.id,
            status: InvoiceStatus.OVERDUE,
            dueDate: dueIn15,
            subtotal: new Decimal("681818.00"),
            taxAmount: new Decimal("122727.00"),
            totalAmount: new Decimal("804545.00"),
            paidAmount: new Decimal("0.00"),
            balanceDue: new Decimal("804545.00"),
            paymentTerms: "Net 15 Days",
            lines: {
              create: [
                { sku: "SUB-CLOUD-PRO", description: "Cloud Analytics Pro", quantity: 1, unitPrice: new Decimal("681818.00"), lineTotal: new Decimal("681818.00") }
              ]
            }
          }
        })
      ]);

      dbInvoices = await prisma.invoice.findMany({
        include: {
          customer: true,
          order: true,
          quotation: true,
          lines: true,
          payments: true,
          creditNotes: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  const invoices: InvoiceItem[] = dbInvoices.map((inv) => {
    const isRecurring = inv.invoiceNumber === "INV-2042" || inv.invoiceNumber === "INV-2031" || inv.invoiceNumber === "INV-2027";
    const statusMap: Record<string, "Paid" | "Pending" | "Past Due" | "Partially Paid" | "Cancelled"> = {
      PAID: "Paid",
      PENDING: "Pending",
      PARTIALLY_PAID: "Partially Paid",
      OVERDUE: "Past Due",
      CANCELLED: "Cancelled",
      DRAFT: "Pending",
    };

    return {
      id: inv.invoiceNumber,
      customer: inv.customer.name,
      type: isRecurring ? "Recurring" : "One-Time",
      source: isRecurring ? "SUB-1042" : "ORD-1042",
      sourceQuote: "Q-1042",
      sourceOrder: "ORD-1042",
      sourceSubscription: isRecurring ? "SUB-1042" : undefined,
      description: inv.lines[0]?.description || "Commercial Enterprise Agreement",
      invoiceDate: (inv.issuedAt || inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      dueDate: inv.dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      paymentTerms: inv.paymentTerms,
      subtotal: Number(inv.subtotal),
      tax: Number(inv.taxAmount),
      total: Number(inv.totalAmount),
      paid: Number(inv.paidAmount),
      balanceDue: Number(inv.balanceDue),
      status: statusMap[inv.status] || "Pending",
      dateRange: "This Month",
      billingPeriod: isRecurring ? { start: "05 Sep 2026", end: "04 Oct 2026" } : undefined,
      nextInvoice: isRecurring ? "05 Oct 2026" : undefined,
      plan: isRecurring ? "Enterprise Core Plan Pro" : undefined,
      billingInterval: isRecurring ? "Monthly" : undefined,
      currentMrr: isRecurring ? Number(inv.subtotal) : undefined,
    };
  });

  const outstanding = invoices.reduce((sum, inv) => (inv.status !== "Paid" ? sum + inv.balanceDue : sum), 0);
  const paidThisMonth = invoices.reduce((sum, inv) => sum + inv.paid, 0);
  const pastDueCount = invoices.filter((inv) => inv.status === "Past Due").length;
  const dueThisWeekCount = invoices.filter((inv) => inv.status === "Pending").length;

  const invoiceStats = [
    { label: "OUTSTANDING", value: formatCurrency(outstanding, "INR"), icon: "account_balance_wallet" },
    { label: "PAID THIS MONTH", value: formatCurrency(paidThisMonth, "INR"), icon: "paid" },
    { label: "PAST DUE", value: `${pastDueCount}`, icon: "error" },
    { label: "DUE THIS WEEK", value: `${dueThisWeekCount}`, icon: "event_upcoming" },
  ];

  return {
    invoices,
    invoiceStats,
  };
}

export async function recordPaymentAction(input: {
  invoiceNumber: string;
  amount: number;
  method?: string;
}) {
  const inv = await prisma.invoice.findUnique({
    where: { invoiceNumber: input.invoiceNumber },
  });

  if (!inv) throw new Error(`Invoice ${input.invoiceNumber} not found`);

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
        invoiceId: inv.id,
        amount: new Decimal(input.amount.toFixed(2)),
        paymentMethod: input.method || "BANK_TRANSFER",
        status: "COMPLETED",
        referenceNumber: `UTR-IN-${Date.now()}`,
      },
    });

    const newPaid = Number(inv.paidAmount) + input.amount;
    const newBalance = Math.max(0, Number(inv.totalAmount) - newPaid);
    const newStatus = newBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.SENT;

    await tx.invoice.update({
      where: { id: inv.id },
      data: {
        paidAmount: new Decimal(newPaid.toFixed(2)),
        balanceDue: new Decimal(newBalance.toFixed(2)),
        status: newStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "Invoice",
        entityId: inv.id,
        action: "RECORD_PAYMENT",
        fromState: inv.status,
        toState: newStatus,
        metadata: {
          invoiceNumber: inv.invoiceNumber,
          amount: input.amount,
          paymentId: payment.id,
        },
      },
    });

    return { success: true, paymentId: payment.id, newBalance, newStatus };
  });
}

export async function issueCreditNoteAction(input: {
  invoiceNumber: string;
  amount: number;
  reason: string;
}) {
  const inv = await prisma.invoice.findUnique({
    where: { invoiceNumber: input.invoiceNumber },
  });

  if (!inv) throw new Error(`Invoice ${input.invoiceNumber} not found`);

  return await prisma.$transaction(async (tx) => {
    const cn = await tx.creditNote.create({
      data: {
        creditNoteNumber: `CN-${Date.now().toString().slice(-6)}`,
        invoiceId: inv.id,
        amount: new Decimal(input.amount.toFixed(2)),
        reason: input.reason,
      },
    });

    const newBalance = Math.max(0, Number(inv.balanceDue) - input.amount);

    await tx.invoice.update({
      where: { id: inv.id },
      data: {
        balanceDue: new Decimal(newBalance.toFixed(2)),
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "Invoice",
        entityId: inv.id,
        action: "ISSUE_CREDIT_NOTE",
        metadata: {
          invoiceNumber: inv.invoiceNumber,
          creditNoteNumber: cn.creditNoteNumber,
          amount: input.amount,
          reason: input.reason,
        },
      },
    });

    return { success: true, creditNoteNumber: cn.creditNoteNumber, noteNumber: cn.creditNoteNumber, newBalance };
  });
}
