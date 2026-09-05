"use client";

import React, { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { billingEvents, invoicePreview, subscriptionChange, subscriptionStats, subscriptions as initialSubscriptions } from "./mockData";
import { formatCurrency } from "@/lib/currency";
import type { BillingInterval, InvoicePreview, Subscription, SubscriptionStatus } from "./types";

const money = (value: number, digits = 0) => formatCurrency(value, "INR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const card = "bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)]";
const successBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]";
const infoBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]";
const warningBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]";
const dangerBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]";
const neutralBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]";
const secondaryButton = "h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright flex items-center gap-1.5 transition-colors shadow-sm";
const primaryButton = "h-8 px-3 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm transition-colors";

const intervalOptions: BillingInterval[] = ["Monthly", "Quarterly", "Yearly"];
const statusOptions: Array<"All" | SubscriptionStatus> = ["All", "Active", "Past Due", "Pending Cancellation", "Paused"];
const filterIntervals: Array<"All" | BillingInterval> = ["All", "Monthly", "Quarterly", "Annual", "Yearly"];

interface SubscriptionsPageProps {
  initialData?: {
    subscriptions: Subscription[];
    subscriptionStats: any[];
  };
}

export function SubscriptionsPage({ initialData }: SubscriptionsPageProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialData?.subscriptions || initialSubscriptions);
  const [selectedId, setSelectedId] = useState(initialData?.subscriptions[0]?.id || "SUB-1042");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SubscriptionStatus>("All");
  const [intervalFilter, setIntervalFilter] = useState<"All" | BillingInterval>("All");
  const [quantityDraft, setQuantityDraft] = useState(15);
  const [showPreview, setShowPreview] = useState(false);
  const [dialog, setDialog] = useState<"quantity" | "cancel" | "invoices" | "manage" | null>(null);

  const selectedSubscription = subscriptions.find((subscription) => subscription.id === selectedId) ?? subscriptions[0];

  const visibleSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscriptions.filter((subscription) => {
      const matchesQuery = !query || [subscription.id, subscription.customer, subscription.plan].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "All" || subscription.status === statusFilter;
      const matchesInterval = intervalFilter === "All" || subscription.billingInterval === intervalFilter;
      return matchesQuery && matchesStatus && matchesInterval;
    });
  }, [intervalFilter, search, statusFilter, subscriptions]);

  const updateSelectedSubscription = (updates: Partial<Subscription>) => {
    setSubscriptions((current) => current.map((subscription) => {
      if (subscription.id !== selectedSubscription.id) return subscription;
      const quantity = updates.quantity ?? subscription.quantity;
      const billingInterval = updates.billingInterval ?? subscription.billingInterval;
      const monthlyAmount = quantity * subscription.unitPrice;
      const recurringValue = billingInterval === "Quarterly" ? monthlyAmount * 3 : billingInterval === "Annual" || billingInterval === "Yearly" ? monthlyAmount * 12 : monthlyAmount;
      const recurringLabel = billingInterval === "Quarterly" ? "per quarter" : billingInterval === "Annual" || billingInterval === "Yearly" ? "ARR" : "MRR";
      return { ...subscription, ...updates, quantity, billingInterval, recurringValue, recurringLabel, mrr: monthlyAmount, arr: monthlyAmount * 12 };
    }));
  };

  const preview = {
    currentQuantity: selectedSubscription.quantity,
    requestedQuantity: quantityDraft,
    currentMonthlyAmount: selectedSubscription.quantity * selectedSubscription.unitPrice,
    newMonthlyAmount: quantityDraft * selectedSubscription.unitPrice,
    estimatedProratedAdjustment: Math.max(0, (quantityDraft - selectedSubscription.quantity) * selectedSubscription.unitPrice * (5 / 30)),
  };

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-32">
            <SubscriptionHeader />
            <SubscriptionStats />
            <section className="grid grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)] gap-space-base items-start">
              <div className="space-y-space-base min-w-0">
                <SubscriptionFilters search={search} statusFilter={statusFilter} intervalFilter={intervalFilter} onSearch={setSearch} onStatusFilter={setStatusFilter} onIntervalFilter={setIntervalFilter} />
                <SubscriptionTable subscriptions={visibleSubscriptions} selectedId={selectedSubscription.id} onSelect={setSelectedId} onViewInvoices={() => setDialog("invoices")} />
                <BillingTimeline />
              </div>
              <div className="space-y-space-base min-w-0">
                <SubscriptionDetail subscription={selectedSubscription} onIntervalChange={(billingInterval) => updateSelectedSubscription({ billingInterval })} />
                <SubscriptionChangePreview preview={preview} showPreview={showPreview} onPreview={() => setShowPreview(true)} onQuantityChange={setQuantityDraft} />
                <RenewalCard subscription={selectedSubscription} />
                <SubscriptionActions onQuantity={() => setDialog("quantity")} onCancel={() => setDialog("cancel")} onInvoices={() => setDialog("invoices")} onManage={() => setDialog("manage")} />
              </div>
            </section>
          </div>
          <SubscriptionActionBar subscription={selectedSubscription} onManage={() => setDialog("manage")} onInvoices={() => setDialog("invoices")} />
        </main>
      </div>

      {dialog === "quantity" && <QuantityDialog subscription={selectedSubscription} quantity={quantityDraft} onQuantityChange={setQuantityDraft} onClose={() => setDialog(null)} onSave={() => { updateSelectedSubscription({ quantity: quantityDraft }); setShowPreview(true); setDialog(null); }} />}
      {dialog === "cancel" && <CancellationDialog subscription={selectedSubscription} onClose={() => setDialog(null)} />}
      {dialog === "invoices" && <InvoicePreviewDialog invoices={invoicePreview} subscription={selectedSubscription} onClose={() => setDialog(null)} />}
      {dialog === "manage" && (
        <ManageDialog
          subscription={selectedSubscription}
          onClose={() => setDialog(null)}
          onTogglePause={async () => {
            const nextStatus: SubscriptionStatus = selectedSubscription.status === "Paused" ? "Active" : "Paused";
            try {
              const { pauseSubscriptionServerAction, resumeSubscriptionServerAction } = await import("@/lib/actions/subscriptionActions");
              if (nextStatus === "Paused") {
                await pauseSubscriptionServerAction(selectedSubscription.id);
              } else {
                await resumeSubscriptionServerAction(selectedSubscription.id);
              }
              updateSelectedSubscription({ status: nextStatus, paymentStatus: nextStatus === "Paused" ? "Paused" : "Paid / Up to Date" });
            } catch (err) {
              console.error("Failed to toggle pause status:", err);
            }
            setDialog(null);
          }}
        />
      )}
    </>
  );
}

function SubscriptionHeader() {
  return <>
    <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
      <span>Operations</span><span className="material-symbols-outlined text-xs">chevron_right</span><span className="text-primary font-semibold">Subscriptions</span>
    </div>
    <div className="flex items-center justify-between pb-space-xs">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">Subscriptions</h1>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">Manage recurring customer commitments, billing schedules and renewals.</p>
        </div>
        <span className={infoBadge}><span className="material-symbols-outlined text-xs">autorenew</span>Recurring Revenue</span>
      </div>
    </div>
  </>;
}

function SubscriptionStats() {
  return <section className="grid grid-cols-4 gap-space-base">
    {subscriptionStats.map((stat) => <div key={stat.label} className={`${card} p-space-base`}>
      <div className="flex items-center justify-between mb-2"><span className="font-label-sm text-[10px] uppercase tracking-wider text-outline font-bold">{stat.label}</span><span className="material-symbols-outlined text-primary text-base">{stat.icon}</span></div>
      <div className="font-headline-sm text-headline-sm font-bold text-on-surface font-code-tabular tnum">{stat.value}</div>
    </div>)}
  </section>;
}

function SubscriptionFilters({ search, statusFilter, intervalFilter, onSearch, onStatusFilter, onIntervalFilter }: { search: string; statusFilter: "All" | SubscriptionStatus; intervalFilter: "All" | BillingInterval; onSearch: (value: string) => void; onStatusFilter: (value: "All" | SubscriptionStatus) => void; onIntervalFilter: (value: "All" | BillingInterval) => void }) {
  return <section className={`${card} p-space-sm flex items-center gap-2`}>
    <label className="relative flex-1 min-w-[220px]">
      <span className="material-symbols-outlined text-outline text-sm absolute left-3 top-1/2 -translate-y-1/2">search</span>
      <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search subscriptions" className="w-full h-9 pl-9 pr-3 rounded-md border border-[#D1D5DB] font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary" />
    </label>
    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-outline uppercase tracking-wider"><span className="material-symbols-outlined text-sm">filter_list</span>Filter</span>
    <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as "All" | SubscriptionStatus)} className="h-9 rounded-md border border-[#D1D5DB] bg-white px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary">
      {statusOptions.map((status) => <option key={status}>{status}</option>)}
    </select>
    <select value={intervalFilter} onChange={(event) => onIntervalFilter(event.target.value as "All" | BillingInterval)} className="h-9 rounded-md border border-[#D1D5DB] bg-white px-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary">
      {filterIntervals.map((interval) => <option key={interval}>{interval}</option>)}
    </select>
  </section>;
}

function SubscriptionTable({ subscriptions, selectedId, onSelect, onViewInvoices }: { subscriptions: Subscription[]; selectedId: string; onSelect: (id: string) => void; onViewInvoices: () => void }) {
  return <section className={`${card} overflow-hidden`}>
    <SectionBar title="Active Subscriptions" subtitle="Current recurring commitments across customers" icon="subscriptions" right={<span className="font-body-sm text-body-sm text-outline">{subscriptions.length} visible</span>} />
    <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left border-collapse">
      <thead><tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider"><th className="py-2.5 px-space-base font-semibold">Subscription</th><th className="py-2.5 px-space-md font-semibold">Customer</th><th className="py-2.5 px-space-md font-semibold">Plan</th><th className="py-2.5 px-space-md font-semibold text-right">Qty</th><th className="py-2.5 px-space-md font-semibold">Interval</th><th className="py-2.5 px-space-md font-semibold text-right">Recurring Value</th><th className="py-2.5 px-space-md font-semibold">Next Billing</th><th className="py-2.5 px-space-md font-semibold">Status</th><th className="py-2.5 px-space-base font-semibold">Action</th></tr></thead>
      <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">{subscriptions.map((subscription) => <tr key={subscription.id} onClick={() => onSelect(subscription.id)} className={`cursor-pointer transition-colors ${selectedId === subscription.id ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"}`}><td className="py-3 px-space-base"><div className="font-semibold text-on-surface font-code-tabular">{subscription.id}</div><div className="font-code-tabular text-[11px] text-outline">{subscription.sourceOrder}</div></td><td className="py-3 px-space-md font-semibold text-on-surface">{subscription.customer}</td><td className="py-3 px-space-md text-on-surface-variant">{subscription.plan}</td><td className="py-3 px-space-md text-right font-code-tabular tnum font-semibold text-on-surface">{subscription.quantity}</td><td className="py-3 px-space-md">{subscription.billingInterval}</td><td className="py-3 px-space-md text-right font-code-tabular tnum font-semibold text-on-surface">{money(subscription.recurringValue)} <span className="text-outline font-normal">{subscription.recurringLabel}</span></td><td className="py-3 px-space-md font-code-tabular text-on-surface-variant">{subscription.nextBillingDate}</td><td className="py-3 px-space-md">{statusBadge(subscription.status)}</td><td className="py-3 px-space-base"><button onClick={(event) => { event.stopPropagation(); onSelect(subscription.id); onViewInvoices(); }} className="p-1 rounded text-outline hover:bg-surface-container hover:text-primary" title="View invoices"><span className="material-symbols-outlined text-sm">receipt_long</span></button></td></tr>)}</tbody>
    </table></div>
  </section>;
}

function SubscriptionDetail({ subscription, onIntervalChange }: { subscription: Subscription; onIntervalChange: (interval: BillingInterval) => void }) {
  const values = [["Status", subscription.status], ["Quantity", `${subscription.quantity}`], ["Billing", subscription.billingInterval], ["MRR", money(subscription.mrr)], ["ARR", money(subscription.arr)], ["Start Date", subscription.startDate], ["Next Invoice", subscription.nextBillingDate], ["Renewal", subscription.renewalDate], ["Payment Status", subscription.paymentStatus]];
  return <section className={`${card} p-space-base`}>
    <div className="flex items-start justify-between pb-space-sm border-b border-[#F1F5F9] mb-space-base">
      <div><span className="font-code-tabular text-label-sm text-primary font-semibold">{subscription.id}</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">{subscription.customer}</h2><p className="font-body-sm text-body-sm text-outline">{subscription.plan}</p></div>
      {statusBadge(subscription.status)}
    </div>
    <div className="flex items-center gap-2 mb-space-base font-code-tabular text-body-sm text-on-surface">
      <span className={neutralBadge}>{subscription.sourceQuote}</span><span className="material-symbols-outlined text-outline text-sm">arrow_forward</span><span className={neutralBadge}>{subscription.sourceOrder}</span><span className="material-symbols-outlined text-outline text-sm">arrow_forward</span><span className={infoBadge}>{subscription.id}</span>
    </div>
    <div className="grid grid-cols-3 gap-x-space-base gap-y-space-sm">{values.map(([label, value]) => <Detail key={label} label={label} value={value} highlight={label === "MRR" || label === "ARR"} />)}</div>
    <div className="mt-space-base pt-space-sm border-t border-[#F1F5F9]"><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline mb-2">Billing Interval</span><div className="flex gap-2">{intervalOptions.map((interval) => <button key={interval} onClick={() => onIntervalChange(interval)} className={`h-8 px-3 rounded-md border font-label-md text-label-md font-semibold transition-colors ${subscription.billingInterval === interval ? "bg-primary text-on-primary border-primary" : "bg-white text-on-surface border-[#D1D5DB] hover:bg-surface-bright"}`}>{interval}</button>)}</div></div>
  </section>;
}

function BillingTimeline() {
  return <section className={`${card} overflow-hidden`}>
    <SectionBar title="Billing Timeline" subtitle="Upcoming and historical recurring billing events" icon="timeline" right={<button className={secondaryButton}>View Full Timeline<span className="material-symbols-outlined text-sm">open_in_new</span></button>} />
    <div className="divide-y divide-[#F1F5F9]">{billingEvents.map((event) => <div key={event.id} className="grid grid-cols-[140px_minmax(0,1fr)_120px_120px] items-center px-space-base py-3 font-body-sm text-body-sm"><span className="font-code-tabular text-outline">{event.date}</span><span className="font-semibold text-on-surface">{event.label}</span><span className="text-right font-code-tabular tnum font-semibold text-on-surface">{money(event.amount)}</span><span className="justify-self-end">{event.status === "Completed" ? successBadgeNode("Completed") : event.status === "Upcoming" ? infoBadgeNode("Upcoming") : neutralBadgeNode("Scheduled")}</span></div>)}</div>
  </section>;
}

function SubscriptionChangePreview({ preview, showPreview, onPreview, onQuantityChange }: { preview: typeof subscriptionChange; showPreview: boolean; onPreview: () => void; onQuantityChange: (quantity: number) => void }) {
  return <section className={`${card} p-space-base`}>
    <div className="flex items-center justify-between mb-space-sm"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-sm">calculate</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Subscription Change Preview</h2></div><button onClick={onPreview} className={secondaryButton}>Preview Change</button></div>
    <div className="grid grid-cols-2 gap-space-sm"><Detail label="Current" value={`${preview.currentQuantity} seats`} /><label><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">Requested</span><input type="number" min="1" value={preview.requestedQuantity} onChange={(event) => onQuantityChange(Math.max(1, Number.parseInt(event.target.value || "1", 10) || 1))} className="mt-1 w-24 h-8 px-2 rounded-md border border-[#D1D5DB] text-right font-code-tabular tnum text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary" /></label><Detail label="Billing interval" value="Monthly" /><Detail label="Current monthly amount" value={money(preview.currentMonthlyAmount)} highlight /></div>
    {showPreview && <div className="mt-space-sm pt-space-sm border-t border-[#F1F5F9] grid grid-cols-3 gap-space-sm"><Detail label="New monthly amount" value={money(preview.newMonthlyAmount)} highlight /><Detail label="Estimated prorated adjustment" value={`+${money(preview.estimatedProratedAdjustment, 2)}`} highlight /><Detail label="New recurring amount" value={`${money(preview.newMonthlyAmount)} / month`} highlight /></div>}
  </section>;
}

function RenewalCard({ subscription }: { subscription: Subscription }) {
  return <section className={`${card} p-space-base`}>
    <div className="flex items-center justify-between mb-space-sm"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">event_repeat</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Renewal</h2></div><span className={successBadge}>Auto-renew</span></div>
    <div className="grid grid-cols-2 gap-space-sm"><Detail label="Renewal Date" value={subscription.renewalDate} /><Detail label="Current Plan" value={subscription.plan} /><Detail label="Current ARR" value={money(subscription.arr)} highlight /><Detail label="Renewal Status" value="Auto-renew" /></div>
  </section>;
}

function SubscriptionActions({ onQuantity, onCancel, onInvoices, onManage }: { onQuantity: () => void; onCancel: () => void; onInvoices: () => void; onManage: () => void }) {
  return <section className={`${card} p-space-base`}>
    <div className="flex items-center gap-2 mb-space-sm"><span className="material-symbols-outlined text-primary text-sm">settings</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Actions</h2></div>
    <div className="grid grid-cols-2 gap-2"><button onClick={onQuantity} className={secondaryButton}>Change Quantity</button><button onClick={onManage} className={secondaryButton}>Change Billing Interval</button><button onClick={onManage} className={secondaryButton}>Pause Subscription</button><button onClick={onInvoices} className={secondaryButton}>View Invoices</button></div>
    <div className="mt-space-sm pt-space-sm border-t border-[#FDE68A]"><button onClick={onCancel} className="h-8 px-3 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] font-label-md text-label-md font-semibold hover:bg-[#FEF3C7] flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">cancel</span>Cancel Subscription</button></div>
  </section>;
}

function SubscriptionActionBar({ subscription, onManage, onInvoices }: { subscription: Subscription; onManage: () => void; onInvoices: () => void }) {
  return <footer className="h-16 px-space-xl bg-white border-t border-[#E5E7EB] flex items-center justify-between flex-shrink-0 z-20 shadow-[0px_-4px_8px_rgba(15,23,42,0.03)]">
    <div className="flex items-center gap-3"><span className={infoBadge}>{subscription.id}</span><span className="font-body-sm text-body-sm text-outline">{subscription.customer} - {subscription.plan}</span></div>
    <div className="flex items-center gap-4"><div className="text-right"><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">MRR</span><span className="font-title-md text-body-md font-bold text-on-surface font-code-tabular tnum">{money(subscription.mrr)} <span className="text-outline font-normal">-</span> {subscription.status}</span></div><button onClick={onInvoices} className={secondaryButton}>View Invoices<span className="material-symbols-outlined text-sm">receipt_long</span></button><button onClick={onManage} className="h-10 px-5 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-title-md text-body-md font-semibold flex items-center gap-2 shadow-sm transition-colors">Manage Subscription<span className="material-symbols-outlined text-base">settings</span></button></div>
  </footer>;
}

function QuantityDialog({ subscription, quantity, onQuantityChange, onClose, onSave }: { subscription: Subscription; quantity: number; onQuantityChange: (quantity: number) => void; onClose: () => void; onSave: () => void }) {
  const newAmount = quantity * subscription.unitPrice;
  return <Dialog title="Change Quantity" onClose={onClose}><div className="space-y-4"><Detail label="Subscription" value={subscription.id} /><label><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">Requested Seats</span><input type="number" min="1" value={quantity} onChange={(event) => onQuantityChange(Math.max(1, Number.parseInt(event.target.value || "1", 10) || 1))} className="mt-1 w-28 h-9 px-2 rounded-md border border-[#D1D5DB] text-right font-code-tabular tnum text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary" /></label><div className="grid grid-cols-2 gap-space-sm"><Detail label="Current monthly amount" value={money(subscription.mrr)} highlight /><Detail label="Updated monthly amount" value={money(newAmount)} highlight /></div></div><div className="flex justify-end gap-2 mt-space-lg"><button onClick={onClose} className={secondaryButton}>Cancel</button><button onClick={onSave} className={primaryButton}>Save Change</button></div></Dialog>;
}

function CancellationDialog({ subscription, onClose }: { subscription: Subscription; onClose: () => void }) {
  return <Dialog title="Cancel Subscription" onClose={onClose}><div className="grid grid-cols-2 gap-space-sm"><Detail label="Subscription" value={subscription.id} /><Detail label="Customer" value={subscription.customer} /><Detail label="Remaining Contract Period" value="8 months" /><Detail label="Amount Already Paid" value={money(39200)} highlight /><Detail label="Estimated Unused Value" value={money(26133.33, 2)} highlight /><Detail label="Estimated Credit Note" value={money(26133.33, 2)} highlight /></div><div className="flex justify-end gap-2 mt-space-lg"><button onClick={onClose} className={secondaryButton}>Keep Subscription</button><button onClick={onClose} className="h-8 px-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] font-label-md text-label-md font-semibold hover:bg-[#FEE2E2]">Confirm Cancellation</button></div></Dialog>;
}

function InvoicePreviewDialog({ subscription, invoices, onClose }: { subscription: Subscription; invoices: InvoicePreview[]; onClose: () => void }) {
  return <Dialog title={`Invoices for ${subscription.id}`} onClose={onClose}><div className="divide-y divide-[#F1F5F9]">{invoices.map((invoice) => <div key={invoice.id} className="grid grid-cols-[1fr_110px_90px] py-2 font-body-sm text-body-sm"><span className="font-code-tabular font-semibold text-on-surface">{invoice.id}<span className="block font-normal text-outline">{invoice.date}</span></span><span className="text-right font-code-tabular tnum font-semibold text-on-surface">{money(invoice.amount)}</span><span className="justify-self-end">{invoice.status === "Paid" ? successBadgeNode(invoice.status) : invoice.status === "Upcoming" ? infoBadgeNode(invoice.status) : neutralBadgeNode(invoice.status)}</span></div>)}</div></Dialog>;
}

function ManageDialog({ subscription, onClose, onTogglePause }: { subscription: Subscription; onClose: () => void; onTogglePause: () => void }) {
  const isPaused = subscription.status === "Paused";
  return (
    <Dialog title="Manage Subscription" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">settings</span>
          <div>
            <h4 className="font-title-md text-xs font-bold text-on-surface">{subscription.id} - {subscription.plan}</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Active recurring agreement for {subscription.customer}. Status: <strong className="text-primary">{subscription.status}</strong>.
            </p>
          </div>
        </div>
        <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded-lg flex items-center justify-between">
          <div>
            <span className="font-label-md text-xs font-semibold text-on-surface block">
              {isPaused ? "Resume Commercial Subscription" : "Pause Subscription Billing"}
            </span>
            <span className="text-[11px] text-outline">
              {isPaused ? "Re-enable recurring invoices and MRR accrual." : "Temporarily suspend dunning and invoice generation."}
            </span>
          </div>
          <button
            type="button"
            onClick={onTogglePause}
            className={`px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors ${
              isPaused ? "bg-[#065F46] hover:bg-[#047857]" : "bg-[#D97706] hover:bg-[#B45309]"
            }`}
          >
            {isPaused ? "Resume Subscription" : "Pause Subscription"}
          </button>
        </div>
      </div>
      <div className="flex justify-end mt-space-lg">
        <button onClick={onClose} className={primaryButton}>Done</button>
      </div>
    </Dialog>
  );
}


function SectionBar({ title, subtitle, icon, right }: { title: string; subtitle?: string; icon: string; right?: React.ReactNode }) { return <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">{icon}</span><div><h2 className="font-title-md text-title-md font-semibold text-on-surface">{title}</h2>{subtitle && <p className="font-body-sm text-[11px] text-outline">{subtitle}</p>}</div></div>{right}</div>; }
function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) { return <div><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">{label}</span><span className={`font-title-md text-body-md font-semibold ${highlight ? "font-code-tabular tnum text-on-surface" : "text-on-surface"}`}>{value}</span></div>; }
function statusBadge(status: SubscriptionStatus) { if (status === "Active") return successBadgeNode(status); if (status === "Past Due") return <span className={dangerBadge}>{status}</span>; if (status === "Pending Cancellation") return <span className={warningBadge}>{status}</span>; return <span className={neutralBadge}>{status}</span>; }
function successBadgeNode(value: string) { return <span className={successBadge}>{value}</span>; }
function infoBadgeNode(value: string) { return <span className={infoBadge}>{value}</span>; }
function neutralBadgeNode(value: string) { return <span className={neutralBadge}>{value}</span>; }
function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#0B1C30]/30 flex items-center justify-center p-space-xl" role="dialog" aria-modal="true" aria-label={title}><div className="w-full max-w-xl bg-white rounded-lg border border-[#E5E7EB] shadow-xl"><div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between"><h2 className="font-title-md text-title-md font-semibold text-on-surface">{title}</h2><button onClick={onClose} className="p-1 rounded text-outline hover:bg-surface-container" aria-label="Close dialog"><span className="material-symbols-outlined text-sm">close</span></button></div><div className="p-space-base">{children}</div></div></div>; }
