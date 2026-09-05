"use client";

import React, { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { invoiceLineItems, invoices as initialInvoices, invoiceStats, invoiceTimeline } from "./mockData";
import { formatCurrency } from "@/lib/currency";
import type { CreditNote, DateRange, Invoice, InvoiceLineItem, InvoiceStatus, InvoiceType, PaymentMethod } from "./types";

const money = (value: number, digits = 0) => formatCurrency(value, "INR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const card = "bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)]";
const successBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]";
const infoBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]";
const warningBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]";
const dangerBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]";
const neutralBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]";
const secondaryButton = "h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright flex items-center gap-1.5 transition-colors shadow-sm";
const primaryButton = "h-8 px-3 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm transition-colors";

const statusOptions: Array<"All" | InvoiceStatus> = ["All", "Paid", "Pending", "Past Due", "Partially Paid", "Cancelled"];
const typeOptions: Array<"All" | InvoiceType> = ["All", "One-Time", "Recurring", "Credit Note"];
const dateOptions: Array<"All" | DateRange> = ["All", "This Week", "This Month", "Last Month"];
const paymentMethods: PaymentMethod[] = ["Bank Transfer", "Credit Card", "Other"];

interface InvoicesPageProps {
  initialData?: {
    invoices: Invoice[];
    invoiceStats: any[];
  };
}

export function InvoicesPage({ initialData }: InvoicesPageProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialData?.invoices || initialInvoices);
  const [selectedId, setSelectedId] = useState(initialData?.invoices[0]?.id || "INV-2042");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | InvoiceType>("All");
  const [dateFilter, setDateFilter] = useState<"All" | DateRange>("All");
  const [paymentAmount, setPaymentAmount] = useState("578200");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Bank Transfer");
  const [creditReason, setCreditReason] = useState("Cancellation");
  const [creditAmount, setCreditAmount] = useState("50000");
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [message, setMessage] = useState("");
  const [dialog, setDialog] = useState<"payment" | "credit" | "preview" | "export" | null>(null);

  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedId) ?? invoices[0];
  const selectedLineItems = invoiceLineItems.filter((item) => item.invoiceId === selectedInvoice.id);
  const selectedCredits = creditNotes.filter((note) => note.invoiceId === selectedInvoice.id);

  const visibleInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesQuery = !query || [invoice.id, invoice.customer, invoice.source, invoice.description, invoice.sourceOrder].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
      const matchesType = typeFilter === "All" || invoice.type === typeFilter;
      const matchesDate = dateFilter === "All" || invoice.dateRange === dateFilter;
      return matchesQuery && matchesStatus && matchesType && matchesDate;
    });
  }, [dateFilter, invoices, search, statusFilter, typeFilter]);

  const recordPayment = async () => {
    const amount = Math.max(0, Number.parseFloat(paymentAmount) || 0);
    try {
      const { recordPaymentServerAction } = await import("@/lib/actions/billingActions");
      await recordPaymentServerAction({
        invoiceNumber: selectedInvoice.id,
        amount,
        method: paymentMethod,
      });

      setInvoices((current) => current.map((invoice) => {
        if (invoice.id !== selectedInvoice.id) return invoice;
        const paid = Math.min(invoice.total, invoice.paid + amount);
        const balanceDue = Math.max(0, invoice.total - paid);
        const status: InvoiceStatus = balanceDue === 0 ? "Paid" : paid > 0 ? "Partially Paid" : invoice.status;
        return { ...invoice, paid, balanceDue, status };
      }));
      setMessage(`${money(amount)} payment recorded and saved to database successfully.`);
    } catch (err) {
      console.error("Failed to record payment:", err);
      setMessage("Failed to record payment.");
    }
    setDialog(null);
  };

  const createCreditNote = async () => {
    const amount = Math.max(0, Number.parseFloat(creditAmount) || 0);
    try {
      const { issueCreditNoteServerAction } = await import("@/lib/actions/billingActions");
      await issueCreditNoteServerAction({
        invoiceNumber: selectedInvoice.id,
        amount,
        reason: creditReason,
      });

      setCreditNotes((current) => [...current, { invoiceId: selectedInvoice.id, reason: creditReason, amount }]);
      setInvoices((current) => current.map((invoice) => {
        if (invoice.id !== selectedInvoice.id) return invoice;
        const balanceDue = Math.max(0, invoice.balanceDue - amount);
        const status: InvoiceStatus = balanceDue === 0 ? "Paid" : invoice.paid > 0 ? "Partially Paid" : invoice.status;
        return { ...invoice, balanceDue, status };
      }));
      setMessage(`Credit note for ${money(amount)} issued and saved to database.`);
    } catch (err) {
      console.error("Failed to issue credit note:", err);
      setMessage("Failed to issue credit note.");
    }
    setDialog(null);
  };

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-32">
            <InvoiceHeader />
            <InvoiceStats />
            <section className="grid grid-cols-[minmax(0,1.35fr)_minmax(390px,0.65fr)] gap-space-base items-start">
              <div className="space-y-space-base min-w-0">
                <InvoiceFilters search={search} statusFilter={statusFilter} typeFilter={typeFilter} dateFilter={dateFilter} onSearch={setSearch} onStatusFilter={setStatusFilter} onTypeFilter={setTypeFilter} onDateFilter={setDateFilter} />
                <InvoiceTable invoices={visibleInvoices} selectedId={selectedInvoice.id} onSelect={(id) => { setSelectedId(id); setMessage(""); }} onAction={(id) => { setSelectedId(id); setDialog("preview"); }} />
                <InvoiceTimeline invoice={selectedInvoice} />
              </div>
              <div className="space-y-space-base min-w-0">
                <InvoiceDetail invoice={selectedInvoice} />
                <InvoiceLineItems invoice={selectedInvoice} items={selectedLineItems} />
                <PaymentStatus invoice={selectedInvoice} onRecord={() => { setPaymentAmount(String(selectedInvoice.balanceDue)); setDialog("payment"); }} />
                <BillingContext invoice={selectedInvoice} />
                <CreditNoteSection invoice={selectedInvoice} creditNotes={selectedCredits} onCreate={() => setDialog("credit")} />
                <InvoiceActions onPreview={() => setDialog("preview")} onPayment={() => { setPaymentAmount(String(selectedInvoice.balanceDue)); setDialog("payment"); }} onExport={() => setDialog("export")} onCredit={() => setDialog("credit")} />
                {message && <div className={`${card} p-space-sm font-body-sm text-body-sm text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]`}>{message}</div>}
              </div>
            </section>
          </div>
          <InvoiceActionBar invoice={selectedInvoice} onPreview={() => setDialog("preview")} onPayment={() => { setPaymentAmount(String(selectedInvoice.balanceDue)); setDialog("payment"); }} />
        </main>
      </div>

      {dialog === "payment" && <PaymentDialog invoice={selectedInvoice} amount={paymentAmount} method={paymentMethod} onAmount={setPaymentAmount} onMethod={setPaymentMethod} onClose={() => setDialog(null)} onSave={recordPayment} />}
      {dialog === "credit" && <CreditNoteDialog invoice={selectedInvoice} reason={creditReason} amount={creditAmount} onReason={setCreditReason} onAmount={setCreditAmount} onClose={() => setDialog(null)} onSave={createCreditNote} />}
      {dialog === "preview" && <InvoicePreviewDialog invoice={selectedInvoice} items={selectedLineItems} creditNotes={selectedCredits} onClose={() => setDialog(null)} />}
      {dialog === "export" && <PlaceholderDialog title="Download / Export" invoice={selectedInvoice} onClose={() => setDialog(null)} />}
    </>
  );
}

function InvoiceHeader() {
  return <>
    <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
      <span>Operations</span><span className="material-symbols-outlined text-xs">chevron_right</span><span className="text-primary font-semibold">Invoices</span>
    </div>
    <div className="flex items-center justify-between pb-space-xs">
      <div className="flex items-center gap-3">
        <div><h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">Invoices</h1><p className="font-body-sm text-body-sm text-outline mt-0.5">Manage one-time and recurring customer billing.</p></div>
        <span className={infoBadge}><span className="material-symbols-outlined text-xs">receipt_long</span>Accounts Receivable</span>
      </div>
    </div>
  </>;
}

function InvoiceStats() {
  return <section className="grid grid-cols-4 gap-space-base">{invoiceStats.map((stat) => <div key={stat.label} className={`${card} p-space-base`}><div className="flex items-center justify-between mb-2"><span className="font-label-sm text-[10px] uppercase tracking-wider text-outline font-bold">{stat.label}</span><span className="material-symbols-outlined text-primary text-base">{stat.icon}</span></div><div className="font-headline-sm text-headline-sm font-bold text-on-surface font-code-tabular tnum">{stat.value}</div></div>)}</section>;
}

function InvoiceFilters({ search, statusFilter, typeFilter, dateFilter, onSearch, onStatusFilter, onTypeFilter, onDateFilter }: { search: string; statusFilter: "All" | InvoiceStatus; typeFilter: "All" | InvoiceType; dateFilter: "All" | DateRange; onSearch: (value: string) => void; onStatusFilter: (value: "All" | InvoiceStatus) => void; onTypeFilter: (value: "All" | InvoiceType) => void; onDateFilter: (value: "All" | DateRange) => void }) {
  return <section className={`${card} p-space-sm flex items-center gap-2`}>
    <label className="relative flex-1 min-w-[260px]"><span className="material-symbols-outlined text-outline text-sm absolute left-3 top-1/2 -translate-y-1/2">search</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search invoices, customers, orders..." className="w-full h-9 pl-9 pr-3 rounded-md border border-[#D1D5DB] font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary" /></label>
    <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as "All" | InvoiceStatus)} className="h-9 rounded-md border border-[#D1D5DB] bg-white px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select>
    <select value={typeFilter} onChange={(event) => onTypeFilter(event.target.value as "All" | InvoiceType)} className="h-9 rounded-md border border-[#D1D5DB] bg-white px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary">{typeOptions.map((type) => <option key={type}>{type}</option>)}</select>
    <select value={dateFilter} onChange={(event) => onDateFilter(event.target.value as "All" | DateRange)} className="h-9 rounded-md border border-[#D1D5DB] bg-white px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary">{dateOptions.map((range) => <option key={range}>{range}</option>)}</select>
  </section>;
}

function InvoiceTable({ invoices, selectedId, onSelect, onAction }: { invoices: Invoice[]; selectedId: string; onSelect: (id: string) => void; onAction: (id: string) => void }) {
  return <section className={`${card} overflow-hidden`}>
    <SectionBar title="Invoices" subtitle="One-time and recurring customer billing" icon="receipt_long" right={<span className="font-body-sm text-body-sm text-outline">{invoices.length} visible</span>} />
    <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left border-collapse">
      <thead><tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider"><th className="py-2.5 px-space-base font-semibold">Invoice</th><th className="py-2.5 px-space-md font-semibold">Customer</th><th className="py-2.5 px-space-md font-semibold">Type</th><th className="py-2.5 px-space-md font-semibold">Source</th><th className="py-2.5 px-space-md font-semibold">Invoice Date</th><th className="py-2.5 px-space-md font-semibold">Due Date</th><th className="py-2.5 px-space-md font-semibold text-right">Total</th><th className="py-2.5 px-space-md font-semibold text-right">Balance</th><th className="py-2.5 px-space-md font-semibold">Status</th><th className="py-2.5 px-space-base font-semibold">Action</th></tr></thead>
      <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">{invoices.map((invoice) => <tr key={invoice.id} onClick={() => onSelect(invoice.id)} className={`cursor-pointer transition-colors ${selectedId === invoice.id ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"}`}><td className="py-3 px-space-base"><div className="font-semibold text-on-surface font-code-tabular">{invoice.id}</div><div className="font-body-sm text-[11px] text-outline truncate max-w-[170px]">{invoice.description}</div></td><td className="py-3 px-space-md font-semibold text-on-surface">{invoice.customer}</td><td className="py-3 px-space-md">{typeBadge(invoice.type)}</td><td className="py-3 px-space-md font-code-tabular text-on-surface-variant">{invoice.source}</td><td className="py-3 px-space-md font-code-tabular text-on-surface-variant">{invoice.invoiceDate}</td><td className="py-3 px-space-md font-code-tabular text-on-surface-variant">{invoice.dueDate}</td><td className="py-3 px-space-md text-right font-code-tabular tnum font-semibold text-on-surface">{money(invoice.total)}</td><td className="py-3 px-space-md text-right font-code-tabular tnum font-semibold text-on-surface">{money(invoice.balanceDue)}</td><td className="py-3 px-space-md">{statusBadge(invoice.status)}</td><td className="py-3 px-space-base"><button onClick={(event) => { event.stopPropagation(); onAction(invoice.id); }} className="p-1 rounded text-outline hover:bg-surface-container hover:text-primary" title="View invoice"><span className="material-symbols-outlined text-sm">visibility</span></button></td></tr>)}</tbody>
    </table></div>
  </section>;
}

function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  return <section className={`${card} p-space-base`}>
    <div className="flex items-start justify-between pb-space-sm border-b border-[#F1F5F9] mb-space-base"><div><span className="font-code-tabular text-label-sm text-primary font-semibold">Invoice: {invoice.id}</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">{invoice.customer}</h2><p className="font-body-sm text-body-sm text-outline">{invoice.description}</p></div>{statusBadge(invoice.status)}</div>
    <div className="flex items-center gap-2 mb-space-base font-code-tabular text-body-sm text-on-surface"><span className={neutralBadge}>{invoice.sourceQuote}</span><span className="material-symbols-outlined text-outline text-sm">arrow_forward</span><span className={neutralBadge}>{invoice.sourceOrder}</span>{invoice.sourceSubscription && <><span className="material-symbols-outlined text-outline text-sm">arrow_forward</span><span className={neutralBadge}>{invoice.sourceSubscription}</span></>}<span className="material-symbols-outlined text-outline text-sm">arrow_forward</span><span className={infoBadge}>{invoice.id}</span></div>
    <div className="grid grid-cols-3 gap-x-space-base gap-y-space-sm"><Detail label="Status" value={invoice.status} /><Detail label="Invoice Date" value={invoice.invoiceDate} /><Detail label="Due Date" value={invoice.dueDate} /><Detail label="Payment Terms" value={invoice.paymentTerms} /><Detail label={invoice.sourceSubscription ? "Source Subscription" : "Invoice Type"} value={invoice.sourceSubscription ?? invoice.type} /><Detail label="Source Order" value={invoice.sourceOrder} /></div>
  </section>;
}

function InvoiceLineItems({ invoice, items }: { invoice: Invoice; items: InvoiceLineItem[] }) {
  return <section className={`${card} overflow-hidden`}>
    <SectionBar title="Invoice Items" subtitle={invoice.id} icon="list_alt" />
    <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead><tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider"><th className="py-2.5 px-space-base">Item</th><th className="py-2.5 px-space-md">Qty</th><th className="py-2.5 px-space-md text-right">Unit Price</th><th className="py-2.5 px-space-base text-right">Amount</th></tr></thead><tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">{items.map((item) => <tr key={`${item.invoiceId}-${item.description}`}><td className="py-2.5 px-space-base"><span className="font-semibold text-on-surface">{item.description}</span>{item.billing && <span className="block font-body-sm text-[11px] text-outline">Billing: {item.billing}</span>}</td><td className="py-2.5 px-space-md text-on-surface-variant">{item.quantity}</td><td className="py-2.5 px-space-md text-right font-code-tabular tnum">{money(item.unitPrice)}</td><td className="py-2.5 px-space-base text-right font-code-tabular tnum font-semibold text-on-surface">{money(item.amount)}</td></tr>)}</tbody></table></div>
    <div className="px-space-base py-space-sm bg-[#F8F9FA] border-t border-[#E5E7EB] space-y-1 font-body-sm text-body-sm"><AmountRow label="Subtotal" value={invoice.subtotal} /><AmountRow label="GST" value={invoice.tax} /><AmountRow label="Total" value={invoice.total} strong /><AmountRow label="Balance Due" value={invoice.balanceDue} strong /></div>
  </section>;
}

function PaymentStatus({ invoice, onRecord }: { invoice: Invoice; onRecord: () => void }) {
  return <section className={`${card} p-space-base`}><div className="flex items-center justify-between mb-space-sm"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">payments</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Payment Status</h2></div><button onClick={onRecord} className={primaryButton}>Record Payment</button></div><div className="grid grid-cols-3 gap-space-sm"><Detail label="Invoice Total" value={money(invoice.total)} highlight /><Detail label="Paid" value={money(invoice.paid)} highlight /><Detail label="Balance Due" value={money(invoice.balanceDue)} highlight /><Detail label="Payment Status" value={invoice.status === "Paid" ? "Paid" : invoice.status === "Partially Paid" ? "Partially Paid" : "Payment Pending"} /><Detail label="Due" value={invoice.dueDate} /></div></section>;
}

function BillingContext({ invoice }: { invoice: Invoice }) {
  return <section className={`${card} p-space-base`}><div className="flex items-center gap-2 mb-space-sm"><span className="material-symbols-outlined text-secondary text-sm">{invoice.type === "Recurring" ? "autorenew" : "shopping_bag"}</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">{invoice.type === "Recurring" ? "Recurring Billing" : "One-Time Invoice Context"}</h2></div>{invoice.type === "Recurring" ? <div className="grid grid-cols-2 gap-space-sm"><Detail label="Subscription" value={invoice.sourceSubscription ?? invoice.source} /><Detail label="Plan" value={invoice.plan ?? invoice.description} /><Detail label="Billing Interval" value={invoice.billingInterval ?? "Monthly"} /><Detail label="Current MRR" value={money(invoice.currentMrr ?? 0)} highlight /><Detail label="Current Billing Period" value={`${invoice.billingPeriod?.start} -> ${invoice.billingPeriod?.end}`} /><Detail label="Next Billing" value={invoice.nextInvoice ?? "N/A"} /></div> : <div className="grid grid-cols-2 gap-space-sm"><Detail label="Invoice Type" value="One-Time" /><Detail label="Source Order" value={invoice.sourceOrder} /><Detail label="Source Quote" value={invoice.sourceQuote} /></div>}</section>;
}

function CreditNoteSection({ invoice, creditNotes, onCreate }: { invoice: Invoice; creditNotes: CreditNote[]; onCreate: () => void }) {
  return <section className={`${card} p-space-base`}><div className="flex items-center justify-between mb-space-sm"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">request_quote</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Credit Notes</h2></div><button onClick={onCreate} className={secondaryButton}>Create Credit Note</button></div>{creditNotes.length === 0 ? <p className="font-body-sm text-body-sm text-outline">No credit notes for {invoice.id}.</p> : <div className="space-y-1">{creditNotes.map((note, index) => <div key={`${note.invoiceId}-${index}`} className="flex justify-between font-body-sm text-body-sm"><span className="text-on-surface-variant">{note.reason}</span><span className="font-code-tabular tnum font-semibold text-[#991B1B]">-{money(note.amount)}</span></div>)}</div>}</section>;
}

function InvoiceTimeline({ invoice }: { invoice: Invoice }) {
  const events = invoiceTimeline.filter((event) => event.invoiceId === invoice.id);
  const fallback = [{ date: invoice.invoiceDate, label: "Invoice Created", tone: "info" as const }, { date: invoice.dueDate, label: invoice.balanceDue > 0 ? "Payment Due" : "Payment Completed", tone: invoice.balanceDue > 0 ? "warning" as const : "success" as const }];
  const timeline = events.length ? events : fallback;
  return <section className={`${card} overflow-hidden`}><SectionBar title="Invoice Timeline" subtitle={invoice.id} icon="timeline" /><div className="divide-y divide-[#F1F5F9]">{timeline.map((event, index) => <div key={`${event.date}-${event.label}-${index}`} className="grid grid-cols-[130px_24px_minmax(0,1fr)] items-center px-space-base py-3 font-body-sm text-body-sm"><span className="font-code-tabular text-outline">{event.date}</span><span className={`material-symbols-outlined text-sm ${event.tone === "success" ? "text-[#065F46]" : event.tone === "warning" ? "text-[#92400E]" : "text-primary"}`}>{event.tone === "success" ? "check_circle" : event.tone === "warning" ? "schedule" : "radio_button_checked"}</span><span className="font-semibold text-on-surface">{event.label}</span></div>)}</div></section>;
}

function InvoiceActions({ onPreview, onPayment, onExport, onCredit }: { onPreview: () => void; onPayment: () => void; onExport: () => void; onCredit: () => void }) {
  return <section className={`${card} p-space-base`}><div className="flex items-center gap-2 mb-space-sm"><span className="material-symbols-outlined text-primary text-sm">settings</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Actions</h2></div><div className="grid grid-cols-2 gap-2"><button onClick={onPreview} className={secondaryButton}>View Invoice</button><button onClick={onPayment} className={secondaryButton}>Record Payment</button><button onClick={onExport} className={secondaryButton}>Download / Export</button><button onClick={onCredit} className={secondaryButton}>Create Credit Note</button></div></section>;
}

function InvoiceActionBar({ invoice, onPreview, onPayment }: { invoice: Invoice; onPreview: () => void; onPayment: () => void }) {
  return <footer className="h-16 px-space-xl bg-white border-t border-[#E5E7EB] flex items-center justify-between flex-shrink-0 z-20 shadow-[0px_-4px_8px_rgba(15,23,42,0.03)]"><div className="flex items-center gap-3"><span className={infoBadge}>{invoice.id}</span><span className="font-body-sm text-body-sm text-outline">{invoice.customer} - {invoice.type}</span></div><div className="flex items-center gap-4"><div className="text-right"><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">Balance Due</span><span className="font-title-md text-body-md font-bold text-on-surface font-code-tabular tnum">{money(invoice.balanceDue)} <span className="text-outline font-normal">-</span> {invoice.status}</span></div><button onClick={onPreview} className={secondaryButton}>View Invoice<span className="material-symbols-outlined text-sm">visibility</span></button><button onClick={onPayment} className="h-10 px-5 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-title-md text-body-md font-semibold flex items-center gap-2 shadow-sm transition-colors">Record Payment<span className="material-symbols-outlined text-base">payments</span></button></div></footer>;
}

function PaymentDialog({ invoice, amount, method, onAmount, onMethod, onClose, onSave }: { invoice: Invoice; amount: string; method: PaymentMethod; onAmount: (value: string) => void; onMethod: (value: PaymentMethod) => void; onClose: () => void; onSave: () => void }) {
  return <Dialog title="Record Payment" onClose={onClose}><div className="grid grid-cols-2 gap-space-sm"><Detail label="Invoice" value={invoice.id} /><Detail label="Amount Due" value={money(invoice.balanceDue)} highlight /><label><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">Payment Amount</span><input type="number" min="0" value={amount} onChange={(event) => onAmount(event.target.value)} className="mt-1 w-full h-9 px-2 rounded-md border border-[#D1D5DB] text-right font-code-tabular tnum text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary" /></label><label><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">Payment Method</span><select value={method} onChange={(event) => onMethod(event.target.value as PaymentMethod)} className="mt-1 w-full h-9 rounded-md border border-[#D1D5DB] bg-white px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary">{paymentMethods.map((option) => <option key={option}>{option}</option>)}</select></label></div><div className="flex justify-end gap-2 mt-space-lg"><button onClick={onClose} className={secondaryButton}>Cancel</button><button onClick={onSave} className={primaryButton}>Record Payment</button></div></Dialog>;
}

function CreditNoteDialog({ invoice, reason, amount, onReason, onAmount, onClose, onSave }: { invoice: Invoice; reason: string; amount: string; onReason: (value: string) => void; onAmount: (value: string) => void; onClose: () => void; onSave: () => void }) {
  const credit = Math.max(0, Number.parseFloat(amount) || 0);
  return <Dialog title="Create Credit Note" onClose={onClose}><div className="grid grid-cols-2 gap-space-sm"><Detail label="Invoice" value={invoice.id} /><label><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">Reason</span><select value={reason} onChange={(event) => onReason(event.target.value)} className="mt-1 w-full h-9 rounded-md border border-[#D1D5DB] bg-white px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary">{["Cancellation", "Proration Adjustment", "Pricing Adjustment", "Other"].map((option) => <option key={option}>{option}</option>)}</select></label><label><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">Credit Amount</span><input type="number" min="0" value={amount} onChange={(event) => onAmount(event.target.value)} className="mt-1 w-full h-9 px-2 rounded-md border border-[#D1D5DB] text-right font-code-tabular tnum text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary" /></label></div><div className="mt-space-base pt-space-sm border-t border-[#F1F5F9] space-y-1"><AmountRow label="Original Invoice" value={invoice.total} /><AmountRow label="Credit" value={-credit} /><AmountRow label="Adjusted Balance" value={Math.max(0, invoice.balanceDue - credit)} strong /></div><div className="flex justify-end gap-2 mt-space-lg"><button onClick={onClose} className={secondaryButton}>Cancel</button><button onClick={onSave} className={primaryButton}>Create Credit Note</button></div></Dialog>;
}

function InvoicePreviewDialog({ invoice, items, creditNotes, onClose }: { invoice: Invoice; items: InvoiceLineItem[]; creditNotes: CreditNote[]; onClose: () => void }) {
  const creditTotal = creditNotes.reduce((sum, note) => sum + note.amount, 0);
  return <Dialog title={`Invoice Preview ${invoice.id}`} onClose={onClose}><div className="border border-[#E5E7EB] rounded-lg p-space-base bg-white"><div className="flex justify-between border-b border-[#E5E7EB] pb-space-sm mb-space-sm"><div><h3 className="font-headline-sm text-title-lg font-bold text-primary">DealFlow360</h3><p className="font-body-sm text-body-sm text-outline">Bill To: {invoice.customer}</p></div><div className="text-right"><span className="block font-code-tabular font-bold text-on-surface">{invoice.id}</span><span className="block font-body-sm text-outline">{invoice.invoiceDate}</span><span className="block font-body-sm text-outline">Due {invoice.dueDate}</span><span className="block font-body-sm text-outline">{invoice.paymentTerms}</span></div></div><div className="divide-y divide-[#F1F5F9]">{items.map((item) => <div key={item.description} className="grid grid-cols-[1fr_90px] py-2 font-body-sm text-body-sm"><span>{item.description}<span className="block text-outline">{item.quantity}{item.billing ? ` - ${item.billing}` : ""}</span></span><span className="text-right font-code-tabular tnum font-semibold">{money(item.amount)}</span></div>)}</div><div className="pt-space-sm border-t border-[#E5E7EB] mt-space-sm space-y-1"><AmountRow label="Subtotal" value={invoice.subtotal} /><AmountRow label="GST" value={invoice.tax} /><AmountRow label="Total" value={invoice.total} strong />{creditTotal > 0 && <AmountRow label="Credit Notes" value={-creditTotal} />}<AmountRow label="Balance Due" value={invoice.balanceDue} strong /></div></div></Dialog>;
}

function PlaceholderDialog({ title, invoice, onClose }: { title: string; invoice: Invoice; onClose: () => void }) {
  return <Dialog title={title} onClose={onClose}><div className="flex items-start gap-3"><span className="material-symbols-outlined text-primary text-2xl">download</span><p className="font-body-sm text-body-sm text-on-surface-variant">{invoice.id} export is represented here as frontend UI only. Real PDF generation, file export and accounting integrations will be connected later.</p></div><div className="flex justify-end mt-space-lg"><button onClick={onClose} className={primaryButton}>Done</button></div></Dialog>;
}

function SectionBar({ title, subtitle, icon, right }: { title: string; subtitle?: string; icon: string; right?: React.ReactNode }) { return <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">{icon}</span><div><h2 className="font-title-md text-title-md font-semibold text-on-surface">{title}</h2>{subtitle && <p className="font-body-sm text-[11px] text-outline">{subtitle}</p>}</div></div>{right}</div>; }
function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) { return <div><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">{label}</span><span className={`font-title-md text-body-md font-semibold ${highlight ? "font-code-tabular tnum text-on-surface" : "text-on-surface"}`}>{value}</span></div>; }
function AmountRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) { return <div className={`flex justify-between ${strong ? "font-title-md text-body-md font-bold" : "font-body-sm text-body-sm"} text-on-surface`}><span>{label}</span><span className="font-code-tabular tnum">{money(value, Number.isInteger(value) ? 0 : 2)}</span></div>; }
function statusBadge(status: InvoiceStatus) { if (status === "Paid") return <span className={successBadge}>{status}</span>; if (status === "Pending") return <span className={infoBadge}>{status}</span>; if (status === "Past Due") return <span className={dangerBadge}>{status}</span>; if (status === "Partially Paid") return <span className={warningBadge}>{status}</span>; return <span className={neutralBadge}>{status}</span>; }
function typeBadge(type: InvoiceType) { return <span className={type === "Recurring" ? infoBadge : type === "Credit Note" ? warningBadge : neutralBadge}>{type}</span>; }
function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#0B1C30]/30 flex items-center justify-center p-space-xl" role="dialog" aria-modal="true" aria-label={title}><div className="w-full max-w-2xl bg-white rounded-lg border border-[#E5E7EB] shadow-xl"><div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between"><h2 className="font-title-md text-title-md font-semibold text-on-surface">{title}</h2><button onClick={onClose} className="p-1 rounded text-outline hover:bg-surface-container" aria-label="Close dialog"><span className="material-symbols-outlined text-sm">close</span></button></div><div className="p-space-base">{children}</div></div></div>; }
