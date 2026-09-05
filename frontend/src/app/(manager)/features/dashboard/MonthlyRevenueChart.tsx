"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartCard } from "../../components/ChartCard";
import { formatCompactINR } from "@/lib/currency";
import type { MonthlyRevenueData } from "../../types/manager.types";

interface MonthlyRevenueChartProps {
  data?: MonthlyRevenueData[];
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ data = [] }) => {
  return (
    <ChartCard
      title="Monthly Revenue Awaiting Approval"
      subtitle="Total commercial pipeline volume awaiting manager review vs cleared revenue"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactINR(v)}
          />
          <Tooltip
            formatter={(value: any) => [formatCompactINR(Number(value)), ""]}
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", paddingBottom: "12px" }}
          />
          <Bar
            dataKey="awaitingApproval"
            name="Awaiting Approval"
            fill="#D97706"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="approvedRevenue"
            name="Approved Revenue"
            fill="#059669"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
