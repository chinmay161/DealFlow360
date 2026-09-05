"use client";

import React from "react";
import Link from "next/link";
import { OverviewMetrics } from "@/lib/services/overviewService";

interface OverviewSalesSnapshotProps {
  pipelineByStage: OverviewMetrics["pipelineByStage"];
  dealHealth: OverviewMetrics["dealHealth"];
}

export const OverviewSalesSnapshot: React.FC<OverviewSalesSnapshotProps> = ({
  pipelineByStage,
  dealHealth,
}) => {
  return (
    <div className="grid grid-cols-12 gap-space-base items-stretch">
      {/* LEFT COLUMN (8 cols): PIPELINE BY STAGE */}
      <div className="col-span-8 bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-primary text-base"
                  data-icon="bar_chart"
                >
                  bar_chart
                </span>
                <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                  Pipeline by Stage
                </h2>
              </div>
              <p className="font-body-sm text-[11px] text-outline mt-0.5">
                Commercial progression across active stages · Click stage to filter
              </p>
            </div>
            <Link
              href="/quotations"
              className="text-label-sm font-label-sm text-primary hover:underline flex items-center gap-0.5"
            >
              <span>Quotations Directory</span>
              <span className="material-symbols-outlined text-xs" data-icon="chevron_right">
                chevron_right
              </span>
            </Link>
          </div>

          {/* Horizontal Stage Bars */}
          <div className="space-y-3">
            {pipelineByStage.map((s) => (
              <Link
                key={s.stage}
                href={s.href}
                className="flex items-center gap-4 group p-1 -mx-1 rounded hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                title={`Filter quotations by ${s.stage}`}
              >
                {/* Stage Name */}
                <div className="w-36 shrink-0 flex items-baseline justify-between">
                  <span className="font-label-md text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                    {s.stage}
                  </span>
                  <span className="font-body-sm text-[11px] text-outline">
                    {s.count} {s.count === 1 ? "deal" : "deals"}
                  </span>
                </div>

                {/* Progress Track & Bar */}
                <div className="flex-1 h-5 bg-[#F1F5F9] rounded overflow-hidden flex relative">
                  <div
                    className="h-full bg-primary hover:bg-[#1E3A8A] transition-all duration-300 rounded"
                    style={{ width: `${Math.max(6, s.percentage)}%` }}
                  ></div>
                </div>

                {/* Value */}
                <div className="w-28 shrink-0 text-right">
                  <span className="font-code-tabular text-body-md font-bold text-on-surface tnum">
                    {s.displayValue}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-2 border-t border-[#F1F5F9] flex justify-between text-[11px] font-label-sm text-outline">
          <span>Real-time database aggregated value</span>
          <span className="font-medium text-primary">Interactive filters enabled</span>
        </div>
      </div>

      {/* RIGHT COLUMN (4 cols): DEAL HEALTH */}
      <div className="col-span-4 bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-space-xs border-b border-[#F1F5F9] mb-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-secondary text-base"
                data-icon="health_and_safety"
              >
                health_and_safety
              </span>
              <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                Deal Health
              </h2>
            </div>
            <span className="text-[11px] text-outline font-label-sm">Risk Assessment</span>
          </div>

          {/* Numerical Stats Grid - Clickable Category Cards */}
          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-[#F1F5F9]">
            {/* Healthy */}
            <Link
              href={dealHealth.healthy.href}
              className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#10B981] transition-all group cursor-pointer"
              title="Filter Healthy deals"
            >
              <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider group-hover:text-[#065F46]">
                Healthy
              </span>
              <span className="font-metric-display text-lg font-bold text-[#065F46] tnum">
                {dealHealth.healthy.count}
              </span>
              <span className="block font-body-sm text-[10px] text-[#065F46]">
                {dealHealth.healthy.percentage}% total
              </span>
            </Link>

            {/* Attention */}
            <Link
              href={dealHealth.attention.href}
              className="p-2 rounded bg-[#FFFDF5] border border-[#FDE68A]/60 hover:border-[#F59E0B] transition-all group cursor-pointer"
              title="Filter Attention deals"
            >
              <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider group-hover:text-[#92400E]">
                Attention
              </span>
              <span className="font-metric-display text-lg font-bold text-[#92400E] tnum">
                {dealHealth.attention.count}
              </span>
              <span className="block font-body-sm text-[10px] text-[#92400E]">
                {dealHealth.attention.percentage}% total
              </span>
            </Link>

            {/* At Risk */}
            <Link
              href={dealHealth.atRisk.href}
              className="p-2 rounded bg-[#FFF5F5] border border-[#FECDD3]/60 hover:border-[#EF4444] transition-all group cursor-pointer"
              title="Filter At-Risk deals"
            >
              <span className="block font-label-sm text-[10px] text-outline uppercase tracking-wider group-hover:text-[#9F1239]">
                At Risk
              </span>
              <span className="font-metric-display text-lg font-bold text-[#9F1239] tnum">
                {dealHealth.atRisk.count}
              </span>
              <span className="block font-body-sm text-[10px] text-[#9F1239]">
                {dealHealth.atRisk.percentage}% total
              </span>
            </Link>
          </div>

          {/* Distribution Visualization Bar */}
          <div className="pt-3">
            <div className="flex items-center justify-between text-body-sm text-[11px] text-outline mb-1.5">
              <span>Risk Distribution</span>
              <span className="font-medium text-on-surface">
                {dealHealth.totalCount} evaluated quotations
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex bg-surface-container">
              <div
                className="h-full bg-[#10B981] transition-all duration-500"
                style={{ width: `${dealHealth.healthy.percentage}%` }}
                title={`Healthy: ${dealHealth.healthy.count} deals`}
              />
              <div
                className="h-full bg-[#F59E0B] transition-all duration-500"
                style={{ width: `${dealHealth.attention.percentage}%` }}
                title={`Attention: ${dealHealth.attention.count} deals`}
              />
              <div
                className="h-full bg-[#EF4444] transition-all duration-500"
                style={{ width: `${dealHealth.atRisk.percentage}%` }}
                title={`At Risk: ${dealHealth.atRisk.count} deals`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-outline mt-2 pt-2 border-t border-[#F1F5F9]">
              <Link
                href={dealHealth.healthy.href}
                className="flex items-center gap-1 hover:text-[#065F46] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Healthy (&lt;40)
              </Link>
              <Link
                href={dealHealth.attention.href}
                className="flex items-center gap-1 hover:text-[#92400E] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                Attention (40-69)
              </Link>
              <Link
                href={dealHealth.atRisk.href}
                className="flex items-center gap-1 hover:text-[#9F1239] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                At Risk (&ge;70)
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#F1F5F9] mt-3 flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>Automated governance</span>
          <Link href="/quotations" className="font-medium text-primary hover:underline">
            View All Deals &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
