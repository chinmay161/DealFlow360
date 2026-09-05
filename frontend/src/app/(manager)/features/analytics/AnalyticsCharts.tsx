"use client";

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartCard } from "../../components/ChartCard";
import { formatCompactINR } from "@/lib/currency";
import type { ManagerAnalyticsData } from "../../types/manager.types";

interface AnalyticsChartsProps {
  data?: ManagerAnalyticsData;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Row 1: Monthly Approvals & Approval Time Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-base">
        {/* 1. Monthly Approvals */}
        <ChartCard
          title="Monthly Approvals"
          subtitle="Approved vs rejected deal volume across monthly governance cycles"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.monthlyApprovals || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: "11px", paddingBottom: "12px" }} />
              <Bar dataKey="approved" name="Approved" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected" fill="#E11D48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Approval Time Trend */}
        <ChartCard
          title="Approval Time Trend"
          subtitle="Average hours to decision compared against the 4.0h SLA target"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.approvalTimeTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip
                formatter={(v: any) => [`${v} hours`, ""]}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: "11px", paddingBottom: "12px" }} />
              <Line type="monotone" dataKey="hours" name="Average Hours" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="slaTarget" name="SLA Benchmark" stroke="#E11D48" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Top Failed Rules & Revenue by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-base">
        {/* 3. Top Failed Rules */}
        <ChartCard
          title="Top Failed Rules"
          subtitle="Most frequent rule infractions requiring managerial exception sign-off"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              layout="vertical"
              data={data?.topFailedRules || []}
              margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="rule"
                tick={{ fill: "#334155", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={150}
              />
              <Tooltip
                formatter={(v: any) => [`${v} Occurrences`, "Exceptions"]}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" name="Exceptions" fill="#EA580C" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Revenue by Status */}
        <ChartCard
          title="Revenue by Status"
          subtitle="Value distribution of approved, pending, and rejected quotations"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.revenueByStatus || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="status" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCompactINR(v)}
              />
              <Tooltip
                formatter={(v: any) => [formatCompactINR(Number(v)), "Amount"]}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {(data?.revenueByStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Approval Distribution & Risk Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-base">
        {/* 5. Approval Distribution */}
        <ChartCard
          title="Approval Distribution"
          subtitle="Proportion of workflows decided across managerial tiers"
        >
          <div className="space-y-4 pt-2">
            {(data?.approvalDistribution || []).map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-on-surface">{item.department}</span>
                  <span className="font-bold text-primary tnum">{item.percentage}% ({item.count} deals)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 6. Risk Score Distribution */}
        <ChartCard
          title="Risk Score Distribution"
          subtitle="Frequency of quotation portfolio across composite risk brackets"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.riskScoreDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: any) => [`${v} Deals`, "Frequency"]}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
