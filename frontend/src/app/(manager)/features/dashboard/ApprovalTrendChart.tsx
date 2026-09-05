"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartCard } from "../../components/ChartCard";
import type { ApprovalTrendData } from "../../types/manager.types";

interface ApprovalTrendChartProps {
  data?: ApprovalTrendData[];
}

export const ApprovalTrendChart: React.FC<ApprovalTrendChartProps> = ({ data = [] }) => {
  return (
    <ChartCard
      title="Approval Trend"
      subtitle="Weekly trajectory of approved, rejected, and pending quotation reviews"
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E11D48" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", paddingBottom: "12px" }}
          />
          <Area
            type="monotone"
            dataKey="approved"
            name="Approved"
            stroke="#059669"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorApproved)"
          />
          <Area
            type="monotone"
            dataKey="pending"
            name="Pending"
            stroke="#D97706"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPending)"
          />
          <Area
            type="monotone"
            dataKey="rejected"
            name="Rejected"
            stroke="#E11D48"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRejected)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
