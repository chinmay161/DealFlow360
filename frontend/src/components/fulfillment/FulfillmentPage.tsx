"use client";

import React, { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import {
  fulfillmentItems as defaultItems,
  fulfillmentOrder as defaultOrder,
  recommendedAllocations as defaultAllocations,
  reservation as defaultReservation,
  shipments as defaultShipments,
  warehouseStock as defaultStock,
} from "./mockData";
import { formatCurrency } from "@/lib/currency";
import type { AllocationStatus, FulfillmentStatus, Shipment, WarehouseAllocation } from "./types";
import type { getLiveFulfillmentData } from "@/lib/services/fulfillmentService";

interface FulfillmentPageProps {
  initialData?: Awaited<ReturnType<typeof getLiveFulfillmentData>>;
}

const money = (value: number) => formatCurrency(value, "INR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const card = "bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)]";
const successBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]";
const infoBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]";
const warningBadge = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]";
const secondaryButton = "h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright flex items-center gap-1.5 transition-colors shadow-sm";

const productName = (productId: string, items: any[] = defaultItems) =>
  items.find((item) => item.id === productId)?.name ?? productId;

const productSku = (productId: string, items: any[] = defaultItems) =>
  items.find((item) => item.id === productId)?.sku ?? "";

export function FulfillmentPage({ initialData }: FulfillmentPageProps) {
  const fulfillmentOrder = initialData?.fulfillmentOrder || defaultOrder;
  const fulfillmentItems = initialData?.fulfillmentItems || defaultItems;
  const recommendedAllocations = initialData?.recommendedAllocations || defaultAllocations;
  const warehouseStock = initialData?.warehouseStock || defaultStock;
  const reservation = initialData?.reservation || defaultReservation;
  const initialShipments = (initialData?.shipments as unknown as Shipment[]) || defaultShipments;

  const [allocationStatus, setAllocationStatus] = useState<AllocationStatus>("Recommended");
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>(fulfillmentOrder.status);
  const [allocations, setAllocations] = useState<WarehouseAllocation[]>(recommendedAllocations);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const allocationTotals = useMemo(() => ({
    units: allocations.reduce((sum, allocation) => sum + Object.values(allocation.allocations).reduce((inner, quantity) => inner + quantity, 0), 0),
    shipping: allocations.reduce((sum, allocation) => sum + allocation.estimatedShippingCost, 0),
  }), [allocations]);

  const updateAllocation = (warehouse: string, productId: string, value: string) => {
    const quantity = Math.max(0, Number.parseInt(value || "0", 10) || 0);
    setAllocations((current) => current.map((allocation) => allocation.warehouse === warehouse
      ? { ...allocation, allocations: { ...allocation.allocations, [productId]: quantity } }
      : allocation));
  };

  const confirmPlan = async () => {
    setIsConfirming(true);
    try {
      const { confirmFulfillmentPlanAction } = await import("@/lib/actions/fulfillmentActions");
      await confirmFulfillmentPlanAction(fulfillmentOrder.sourceQuote || "Q-1042");
      setFulfillmentStatus("Plan Confirmed");
      setIsConfirmationOpen(true);
    } catch (err) {
      console.error("Failed to confirm fulfillment plan:", err);
    } finally {
      setIsConfirming(false);
    }
  };


  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-32">
            <FulfillmentHeader order={fulfillmentOrder} status={fulfillmentStatus} />
            <OrderSummary order={fulfillmentOrder} status={fulfillmentStatus} />
            <FulfillmentItemsTable items={fulfillmentItems} />
            <InventoryAvailability stock={warehouseStock} />
            <RecommendedSplit
              allocations={allocations}
              status={allocationStatus}
              onAccept={() => setAllocationStatus("Accepted")}
              onManualOverride={() => setIsOverrideOpen(true)}
            />
            <AllocationReason />
            <div className="grid grid-cols-2 gap-space-base">
              <ReservationCard reservation={reservation} onView={() => setIsReservationOpen(true)} />
              <ShipmentPlan shipments={initialShipments} onView={setActiveShipment} />
            </div>
            <BackorderStatus />
            <FulfillmentSummary allocationUnits={allocationTotals.units} shipping={allocationTotals.shipping} status={fulfillmentStatus} />
          </div>
          <FulfillmentActionBar
            allocationUnits={allocationTotals.units}
            shipping={allocationTotals.shipping}
            draftSaved={draftSaved}
            isConfirming={isConfirming}
            onSaveDraft={() => setDraftSaved(true)}
            onConfirm={confirmPlan}
          />
        </main>
      </div>

      {isOverrideOpen && <ManualOverrideDialog allocations={allocations} onChange={updateAllocation} onClose={() => setIsOverrideOpen(false)} onSave={() => { setAllocationStatus("Accepted"); setIsOverrideOpen(false); }} />}
      {isReservationOpen && <ReservationDialog reservation={reservation} onClose={() => setIsReservationOpen(false)} />}
      {activeShipment && <ShipmentDialog shipment={activeShipment} onClose={() => setActiveShipment(null)} />}
      {isConfirmationOpen && <ConfirmationDialog onClose={() => setIsConfirmationOpen(false)} />}
    </>
  );
}

function FulfillmentHeader({ status, order }: { status: FulfillmentStatus; order: any }) {
  const currentOrder = order || defaultOrder;
  return <>
    <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
      <span>Operations</span><span className="material-symbols-outlined text-xs">chevron_right</span><span>Fulfillment</span><span className="material-symbols-outlined text-xs">chevron_right</span><span className="text-primary font-semibold">ORD-1042</span>
    </div>
    <div className="flex items-center justify-between pb-space-xs">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">Fulfillment Order #ORD-1042</h1>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">{currentOrder.customer} <span className="mx-1">·</span> From Quote #Q-1042</p>
        </div>
        <span className={status === "Plan Confirmed" ? infoBadge : warningBadge}><span className="material-symbols-outlined text-xs">{status === "Plan Confirmed" ? "task_alt" : "inventory_2"}</span>{status}</span>
        <span className={infoBadge}><span className="material-symbols-outlined text-xs">widgets</span>15 Physical Units</span>
      </div>
    </div>
  </>;
}

function OrderSummary({ status, order }: { status: FulfillmentStatus; order: any }) {
  const currentOrder = order || defaultOrder;
  const values = [
    ["Customer", currentOrder.customer], ["Source Quote", currentOrder.sourceQuote], ["Order Value", money(currentOrder.orderValue)], ["Physical Units", "15"], ["Fulfillment Status", status], ["Approval", currentOrder.approval], ["Sales Representative", currentOrder.salesRepresentative],
  ];
  return <section className={`${card} p-space-base grid grid-cols-4 gap-x-space-lg gap-y-space-base`}>
    {values.map(([label, value]) => <div key={label}><span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">{label}</span><span className={`font-title-md text-body-md font-semibold ${label === "Fulfillment Status" ? "text-primary" : "text-on-surface"}`}>{value}</span></div>)}
  </section>;
}

function FulfillmentItemsTable({ items }: { items?: any[] }) {
  const currentItems = items || defaultItems;
  return <section className={`${card} overflow-hidden`}>
    <SectionBar title="Order Items" detail="3 order lines · 15 physical units" icon="format_list_bulleted" />
    <div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[780px]">
      <thead><tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider"><th className="py-2.5 px-space-base font-semibold">Item &amp; SKU</th><th className="py-2.5 px-space-md font-semibold text-right">Qty</th><th className="py-2.5 px-space-md font-semibold">Type</th><th className="py-2.5 px-space-md font-semibold">Stock Status</th><th className="py-2.5 px-space-base font-semibold">Fulfillment Status</th></tr></thead>
      <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">{currentItems.map((item: any) => <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors"><td className="py-3 px-space-base"><div className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${item.type === "Hardware" ? "text-primary" : "text-outline"}`}>{item.type === "Hardware" ? "inventory_2" : "support_agent"}</span><div><div className="font-semibold text-on-surface">{item.name}</div><div className="font-code-tabular text-[11px] text-outline">SKU: {item.sku}</div></div></div></td><td className="py-3 px-space-md text-right font-code-tabular tnum font-semibold text-on-surface">{item.quantity}</td><td className="py-3 px-space-md"><span className={item.type === "Hardware" ? infoBadge : "inline-flex px-2 py-0.5 rounded text-label-sm font-semibold bg-[#F1F5F9] text-[#475569]"}>{item.type}</span></td><td className="py-3 px-space-md"><span className={item.stockStatus === "Available" ? successBadge : "text-outline"}>{item.stockStatus}</span></td><td className="py-3 px-space-base"><span className={item.fulfillmentStatus === "Ready" ? successBadge : infoBadge}>{item.fulfillmentStatus}</span></td></tr>)}</tbody>
    </table></div>
  </section>;
}

function InventoryAvailability({ stock }: { stock?: any[] }) {
  const currentStock = stock || defaultStock;
  return <section className={`${card} overflow-hidden`}>
    <SectionBar title="Inventory Availability" subtitle="Live stock position across eligible warehouses" icon="warehouse" />
    <div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[760px]"><thead><tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider"><th className="py-2.5 px-space-base font-semibold">Product</th><th className="py-2.5 px-space-md font-semibold">Warehouse</th><th className="py-2.5 px-space-md text-right font-semibold">Available</th><th className="py-2.5 px-space-md text-right font-semibold">Reserved</th><th className="py-2.5 px-space-md text-right font-semibold">Fulfillable</th><th className="py-2.5 px-space-base font-semibold">Status</th></tr></thead><tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">{currentStock.map((stockItem: any) => { const status = stockItem.fulfillable === 0 ? "Unavailable" : stockItem.fulfillable < 4 ? "Limited" : "Available"; return <tr key={`${stockItem.productId}-${stockItem.warehouse}`} className="hover:bg-[#F8FAFC]"><td className="py-2.5 px-space-base"><span className="font-semibold text-on-surface">{productName(stockItem.productId)}</span><span className="font-code-tabular text-[11px] text-outline ml-2">{productSku(stockItem.productId)}</span></td><td className="py-2.5 px-space-md text-on-surface-variant">{stockItem.warehouse}</td><td className="py-2.5 px-space-md text-right font-code-tabular tnum">{stockItem.available}</td><td className="py-2.5 px-space-md text-right font-code-tabular tnum text-outline">{stockItem.reserved}</td><td className="py-2.5 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">{stockItem.fulfillable}</td><td className="py-2.5 px-space-base"><span className={status === "Available" ? successBadge : status === "Limited" ? warningBadge : "inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]"}>{status}</span></td></tr>; })}</tbody></table></div>
  </section>;
}

function RecommendedSplit({ allocations, status, onAccept, onManualOverride }: { allocations: WarehouseAllocation[]; status: AllocationStatus; onAccept: () => void; onManualOverride: () => void }) {
  const shipping = allocations.reduce((total, allocation) => total + allocation.estimatedShippingCost, 0);
  const groups = allocations.reduce((total, allocation) => total + allocation.shipmentGroups, 0);
  return <section className={`${card} overflow-hidden border-primary/25`}>
    <SectionBar title="Recommended Fulfillment Split" subtitle="Cost-optimized allocation based on current warehouse availability" icon="auto_awesome" right={<span className={status === "Accepted" ? successBadge : infoBadge}><span className="material-symbols-outlined text-xs">{status === "Accepted" ? "check_circle" : "auto_awesome"}</span>{status}</span>} />
    <div className="p-space-base grid grid-cols-2 gap-space-base">{allocations.map((allocation) => <div key={allocation.warehouse} className="border border-[#E5E7EB] rounded-lg p-space-base bg-surface-bright"><div className="flex justify-between items-start border-b border-[#E5E7EB] pb-space-sm"><div><div className="flex items-center gap-1.5 font-title-md text-title-md font-semibold text-on-surface"><span className="material-symbols-outlined text-primary text-base">warehouse</span>{allocation.warehouse}</div><span className="font-body-sm text-[11px] text-outline">Available stock used: {allocation.availableStock} units</span></div><span className={successBadge}>Allocated</span></div><div className="py-space-sm space-y-1.5">{Object.entries(allocation.allocations).map(([productId, quantity]) => <div className="flex justify-between font-body-sm text-body-sm" key={productId}><span className="text-on-surface-variant">{productName(productId)}</span><span className="font-code-tabular tnum font-semibold text-on-surface">{quantity} units</span></div>)}</div><div className="pt-space-sm border-t border-[#E5E7EB] grid grid-cols-2 gap-2 text-body-sm"><div><span className="block text-outline text-[11px]">Est. shipping</span><span className="font-code-tabular tnum font-bold text-on-surface">{money(allocation.estimatedShippingCost)}</span></div><div><span className="block text-outline text-[11px]">Shipment groups</span><span className="font-code-tabular tnum font-bold text-on-surface">{allocation.shipmentGroups}</span></div></div></div>)}</div>
    <div className="px-space-base py-space-sm border-t border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between"><div className="flex gap-space-lg font-body-sm text-body-sm text-outline"><span><strong className="text-on-surface">2</strong> Warehouses</span><span><strong className="text-on-surface">{groups}</strong> Shipment Groups</span><span>Estimated Shipping Cost: <strong className="font-code-tabular tnum text-on-surface">{money(shipping)}</strong></span></div><div className="flex gap-2"><button onClick={onManualOverride} className={secondaryButton}><span className="material-symbols-outlined text-sm">tune</span>Manual Override</button><button onClick={onAccept} className="h-8 px-3 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm transition-colors"><span className="material-symbols-outlined text-sm">check</span>{status === "Accepted" ? "Split Accepted" : "Accept Recommended Split"}</button></div></div>
  </section>;
}

function AllocationReason() {
  return <section className="grid grid-cols-3 gap-space-base"><div className={`${card} p-space-base col-span-2`}><div className="flex items-center gap-2 mb-space-sm"><span className="material-symbols-outlined text-secondary text-sm">psychology</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Why this allocation?</h2></div><div className="grid grid-cols-2 gap-y-2 font-body-sm text-body-sm text-on-surface-variant">{["Fulfills all currently available physical units", "Uses 2 warehouses", "Minimizes estimated shipment cost", "Avoids unnecessary third shipment"].map((reason) => <div className="flex items-center gap-1.5" key={reason}><span className="material-symbols-outlined text-[#10B981] text-sm">check_circle</span>{reason}</div>)}</div></div><div className={`${card} p-space-base border-[#FDE68A]`}><span className="font-label-sm text-[10px] uppercase tracking-wider text-[#92400E]">Rejected Alternative</span><div className="font-title-md text-body-md font-semibold text-on-surface mt-1">Bengaluru + Mumbai + Delhi</div><div className="font-body-sm text-[11px] text-outline mt-1">3 Warehouses · 5 Shipment Groups · {money(18500)}</div><p className="font-body-sm text-[11px] text-[#92400E] mt-2">Higher shipment cost and additional shipment group.</p></div></section>;
}

function ReservationCard({ reservation, onView }: { reservation?: any; onView: () => void }) {
  const currentRes = reservation || defaultReservation;
  return <section className={`${card} p-space-base`}><div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">lock</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Stock Reservation</h2></div><span className={successBadge}><span className="material-symbols-outlined text-xs">check_circle</span>Reserved</span></div><div className="grid grid-cols-3 gap-space-base font-body-sm"><Detail label="Reservation ID" value={currentRes.id} /><Detail label="Reserved At" value={currentRes.reservedAt} /><Detail label="Expires" value={currentRes.expiresAt} /></div><div className="mt-space-base pt-space-sm border-t border-[#F1F5F9] flex justify-between items-center"><span className="font-body-sm text-body-sm text-outline">Bengaluru: Laptop × 5, Display × 2 <span className="mx-1">·</span> Mumbai: Laptop × 5, Display × 3</span><button onClick={onView} className={secondaryButton}>View Reservation<span className="material-symbols-outlined text-sm">open_in_new</span></button></div></section>;
}

function ShipmentPlan({ shipments, onView }: { shipments?: any[]; onView: (shipment: Shipment) => void }) {
  const currentShipments = (shipments || defaultShipments) as Shipment[];
  return <section className={`${card} p-space-base`}><div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">local_shipping</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Shipment Plan</h2></div><span className={infoBadge}>2 Shipments</span></div><div className="space-y-2">{currentShipments.map((shipment: any) => <div key={shipment.id} className="flex items-center justify-between p-2 rounded bg-surface-bright border border-[#E5E7EB]"><div><div className="font-title-md text-body-md font-semibold text-on-surface">{shipment.id} <span className="font-normal text-outline">·</span> {shipment.warehouse}</div><span className="font-body-sm text-[11px] text-outline">{shipment.items?.map((item: any) => `${productName(item.productId)} × ${item.quantity}`).join(" · ")}</span></div><div className="flex items-center gap-2"><span className={successBadge}>Ready to Ship</span><button onClick={() => onView(shipment)} className="p-1 rounded text-outline hover:bg-surface-container hover:text-primary" title="View shipment"><span className="material-symbols-outlined text-sm">visibility</span></button></div></div>)}</div><div className="mt-space-sm pt-space-sm border-t border-[#F1F5F9] flex justify-between font-body-sm text-body-sm text-outline"><span>15 physical units</span><span>Est. shipping: <strong className="font-code-tabular tnum text-on-surface">{money(12000)}</strong></span></div></section>;
}

function BackorderStatus() { return <section className={`${card} p-space-base flex items-center justify-between`}><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center"><span className="material-symbols-outlined text-[#065F46]">assignment_turned_in</span></span><div><h2 className="font-title-md text-title-md font-semibold text-on-surface">Backorders</h2><p className="font-body-sm text-body-sm text-outline">No backorders — all physical units are currently available for fulfillment.</p></div></div><div className="text-right"><button disabled className="h-8 px-3 rounded-md border border-[#D1D5DB] text-outline font-label-md text-label-md cursor-not-allowed opacity-70">Consolidate Remaining Backorder</button><p className="font-body-sm text-[10px] text-outline mt-1">Unavailable quantities will appear here.</p></div></section>; }

function FulfillmentSummary({ allocationUnits, shipping, status }: { allocationUnits: number; shipping: number; status: FulfillmentStatus }) { const values = [["Physical units", "15"], ["Allocated", `${allocationUnits}`], ["Reserved", "15"], ["Backordered", "0"], ["Warehouses", "2"], ["Shipments", "2"], ["Estimated shipping", money(shipping)]]; return <section className={`${card} p-space-base`}><div className="flex justify-between items-center pb-space-xs border-b border-[#F1F5F9] mb-space-base"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">fact_check</span><h2 className="font-title-md text-title-md font-semibold text-on-surface">Fulfillment Summary</h2></div><span className={status === "Plan Confirmed" ? infoBadge : successBadge}>{status === "Plan Confirmed" ? "Plan Confirmed" : "Ready to Ship"}</span></div><div className="grid grid-cols-7 gap-space-base">{values.map(([label, value]) => <div key={label}><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">{label}</span><span className="font-title-md text-title-md font-bold text-on-surface font-code-tabular tnum">{value}</span></div>)}</div></section>; }

function FulfillmentActionBar({ allocationUnits, shipping, draftSaved, isConfirming, onSaveDraft, onConfirm }: { allocationUnits: number; shipping: number; draftSaved: boolean; isConfirming?: boolean; onSaveDraft: () => void; onConfirm: () => void }) {
  return <footer className="h-16 px-space-xl bg-white border-t border-[#E5E7EB] flex items-center justify-between flex-shrink-0 z-20 shadow-[0px_-4px_8px_rgba(15,23,42,0.03)]"><div className="flex items-center gap-3"><button onClick={onSaveDraft} className="h-9 px-4 rounded-md bg-white border border-[#D1D5DB] text-on-surface hover:bg-[#F9FAFB] font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-sm"><span className="material-symbols-outlined text-sm text-outline">save</span>{draftSaved ? "Draft Saved" : "Save Draft"}</button>{draftSaved && <span className="font-body-sm text-body-sm text-[#065F46]">Saved locally for this session</span>}</div><div className="flex items-center gap-4"><div className="text-right"><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">Estimated Shipping</span><span className="font-title-md text-body-md font-bold text-on-surface font-code-tabular tnum">{money(shipping)} <span className="text-outline font-normal">·</span> {allocationUnits} / 15 units</span></div><button onClick={onConfirm} disabled={isConfirming} className="h-10 px-5 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary font-title-md text-body-md font-semibold flex items-center gap-2 shadow-sm transition-colors">{isConfirming ? "Confirming..." : "Confirm Fulfillment Plan"}<span className="material-symbols-outlined text-base">send</span></button></div></footer>;
}

function SectionBar({ title, subtitle, detail, icon, right }: { title: string; subtitle?: string; detail?: string; icon: string; right?: React.ReactNode }) { return <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">{icon}</span><div><h2 className="font-title-md text-title-md font-semibold text-on-surface">{title}</h2>{subtitle && <p className="font-body-sm text-[11px] text-outline">{subtitle}</p>}</div></div>{right ?? <span className="font-body-sm text-body-sm text-outline">{detail}</span>}</div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><span className="block font-label-sm text-[10px] uppercase tracking-wider text-outline">{label}</span><span className="font-title-md text-body-md font-semibold text-on-surface">{value}</span></div>; }

function ManualOverrideDialog({ allocations, onChange, onClose, onSave }: { allocations: WarehouseAllocation[]; onChange: (warehouse: string, productId: string, value: string) => void; onClose: () => void; onSave: () => void }) { return <Dialog title="Manual Allocation Override" onClose={onClose}><p className="font-body-sm text-body-sm text-on-surface-variant mb-space-base">Adjust warehouse quantities for this frontend-only plan. Availability validation will be supplied by future inventory services.</p><div className="space-y-3">{allocations.map((allocation) => <div key={allocation.warehouse} className="border border-[#E5E7EB] rounded-lg p-space-base"><div className="font-title-md text-body-md font-semibold text-on-surface mb-2">{allocation.warehouse}</div>{Object.entries(allocation.allocations).map(([productId, quantity]) => <label className="flex items-center justify-between py-1" key={productId}><span className="font-body-sm text-body-sm text-on-surface-variant">{productName(productId)}</span><input aria-label={`${allocation.warehouse} ${productName(productId)} quantity`} type="number" min="0" value={quantity} onChange={(event) => onChange(allocation.warehouse, productId, event.target.value)} className="w-20 h-8 px-2 rounded-md border border-[#D1D5DB] text-right font-code-tabular tnum text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary" /></label>)}</div>)}</div><div className="flex justify-end gap-2 mt-space-lg"><button onClick={onClose} className={secondaryButton}>Cancel</button><button onClick={onSave} className="h-8 px-3 rounded-md bg-primary text-on-primary font-label-md text-label-md font-semibold">Save Manual Split</button></div></Dialog>; }
function ReservationDialog({ reservation, onClose }: { reservation?: any; onClose: () => void }) {
  const currentRes = reservation || defaultReservation;
  return <Dialog title={`Reservation ${currentRes.id}`} onClose={onClose}><div className="space-y-3 font-body-sm text-body-sm"><Detail label="Status" value="Reserved" /><Detail label="Reserved At" value={currentRes.reservedAt} /><Detail label="Reservation Expires" value={currentRes.expiresAt} /><div className="pt-3 border-t border-[#E5E7EB]"><span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Reserved quantities</span><p className="text-on-surface mt-1">Bengaluru Warehouse: Laptop Pro 14 × 5, Studio Display × 2</p><p className="text-on-surface">Mumbai Warehouse: Laptop Pro 14 × 5, Studio Display × 3</p></div></div></Dialog>;
}
function ShipmentDialog({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) { return <Dialog title={`Shipment ${shipment.id}`} onClose={onClose}><div className="space-y-3 font-body-sm text-body-sm"><Detail label="Warehouse" value={shipment.warehouse} /><Detail label="Status" value={shipment.status} /><Detail label="Estimated Shipping" value={money(shipment.estimatedShippingCost)} /><div className="pt-3 border-t border-[#E5E7EB]"><span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Items</span>{shipment.items.map((item) => <p key={item.productId} className="text-on-surface mt-1">{productName(item.productId)} × {item.quantity}</p>)}</div></div></Dialog>; }
function ConfirmationDialog({ onClose }: { onClose: () => void }) { return <Dialog title="Fulfillment plan confirmed" onClose={onClose}><div className="flex items-start gap-3"><span className="material-symbols-outlined text-[#10B981] text-2xl">check_circle</span><p className="font-body-sm text-body-sm text-on-surface-variant">ORD-1042 is marked as Plan Confirmed in this local frontend session. No reservation, shipment, or inventory transaction has been sent to a backend.</p></div><div className="flex justify-end mt-space-lg"><button onClick={onClose} className="h-8 px-3 rounded-md bg-primary text-on-primary font-label-md text-label-md font-semibold">Done</button></div></Dialog>; }
function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#0B1C30]/30 flex items-center justify-center p-space-xl" role="dialog" aria-modal="true" aria-label={title}><div className="w-full max-w-xl bg-white rounded-lg border border-[#E5E7EB] shadow-xl"><div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between"><h2 className="font-title-md text-title-md font-semibold text-on-surface">{title}</h2><button onClick={onClose} className="p-1 rounded text-outline hover:bg-surface-container" aria-label="Close dialog"><span className="material-symbols-outlined text-sm">close</span></button></div><div className="p-space-base">{children}</div></div></div>; }
