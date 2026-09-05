"use client";

import React from "react";
import Link from "next/link";
import { OverviewMetrics } from "@/lib/services/overviewService";

interface OverviewOperationalSnapshotProps {
  operational: OverviewMetrics["operational"];
}

export const OverviewOperationalSnapshot: React.FC<OverviewOperationalSnapshotProps> = ({
  operational,
}) => {
  const { fulfillment, subscriptions, invoices } = operational;

  return (
    <div className="grid grid-cols-3 gap-space-base">
      {/* CARD 1: FULFILLMENT */}
      <Link
        href={fulfillment.href}
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-primary/50 transition-all group cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary text-base"
                data-icon="local_shipping"
              >
                local_shipping
              </span>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                Fulfillment
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              Ready
            </span>
          </div>

          <div className="space-y-2 font-body-sm text-body-sm">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Orders Awaiting</span>
              <span className="font-semibold text-on-surface font-code-tabular">
                {fulfillment.ordersAwaitingCount} ({fulfillment.primaryOrderRef} · {fulfillment.primaryOrderValue})
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Physical Units</span>
              <span className="font-semibold text-on-surface font-code-tabular">
                {fulfillment.physicalUnitsCount} Units Allocated
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Backorders</span>
              <span className="font-semibold text-[#065F46] font-code-tabular">
                {fulfillment.backordersCount} Backorders
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Warehouse Hubs</span>
              <span className="text-[11px] font-medium text-outline truncate max-w-[190px]">
                {fulfillment.warehousesSummary}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#F1F5F9] mt-3 flex items-center justify-between font-label-sm text-[11px] text-primary font-semibold">
          <span>Open Fulfillment Console</span>
          <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform" data-icon="arrow_forward">
            arrow_forward
          </span>
        </div>
      </Link>

      {/* CARD 2: SUBSCRIPTIONS */}
      <Link
        href={subscriptions.href}
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-primary/50 transition-all group cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-secondary text-base"
                data-icon="autorenew"
              >
                autorenew
              </span>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                Subscriptions
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Recurring
            </span>
          </div>

          <div className="space-y-2 font-body-sm text-body-sm">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Active Contracts</span>
              <span className="font-semibold text-on-surface font-code-tabular">
                {subscriptions.activeSubscriptionsCount} Enterprise Accounts
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Monthly Recurring (MRR)</span>
              <span className="font-bold text-on-surface font-code-tabular">
                {subscriptions.totalMrr}
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Annual Run Rate (ARR)</span>
              <span className="font-semibold text-primary font-code-tabular">
                {subscriptions.totalArr}
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Contract Health</span>
              <span className="text-[11px] font-medium text-[#065F46]">
                {subscriptions.statusNote}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#F1F5F9] mt-3 flex items-center justify-between font-label-sm text-[11px] text-primary font-semibold">
          <span>Manage Subscriptions</span>
          <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform" data-icon="arrow_forward">
            arrow_forward
          </span>
        </div>
      </Link>

      {/* CARD 3: INVOICES */}
      <Link
        href={invoices.href}
        className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-primary/50 transition-all group cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary text-base"
                data-icon="receipt_long"
              >
                receipt_long
              </span>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                Invoices
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
              Billing
            </span>
          </div>

          <div className="space-y-2 font-body-sm text-body-sm">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Outstanding Balance</span>
              <span className="font-bold text-[#92400E] font-code-tabular">
                {invoices.outstandingValue}
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Collected This Month</span>
              <span className="font-semibold text-[#065F46] font-code-tabular">
                {invoices.paidThisMonth}
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Invoices Generated</span>
              <span className="font-semibold text-on-surface font-code-tabular">
                {invoices.generatedCount} Records
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Due This Week</span>
              <span className="text-[11px] font-semibold text-[#9F1239]">
                {invoices.dueThisWeek} Invoices Scheduled
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#F1F5F9] mt-3 flex items-center justify-between font-label-sm text-[11px] text-primary font-semibold">
          <span>Accounts Receivable</span>
          <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform" data-icon="arrow_forward">
            arrow_forward
          </span>
        </div>
      </Link>
    </div>
  );
};
