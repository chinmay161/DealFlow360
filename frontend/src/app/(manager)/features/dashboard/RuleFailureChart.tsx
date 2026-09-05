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
  Cell,
} from "recharts";
import { ChartCard } from "../../components/ChartCard";
import type { RuleFailureData } from "../../types/manager.types";

interface RuleFailureChartProps {
  data?: RuleFailureData[];
}

export const RuleFailureChart: React.FC<RuleFailureChartProps> = ({ data = [] }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "#E11D48";
      case "HIGH":
        return "#EA580C";
      case "MEDIUM":
        return "#D97706";
      default:
        return "#3B82F6";
    }
  };

  return (
    <ChartCard
      title="Rule Failure Distribution"
      subtitle="Top rule exceptions triggering managerial review requirements"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
          <XAxis
            type="number"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="ruleName"
            tick={{ fill: "#334155", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={160}
          />
          <Tooltip
            formatter={(value: any, name: any, item: any) => [
              `${value} Violations (${item.payload.severity})`,
              "Exceptions",
            ]}
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="failures" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
