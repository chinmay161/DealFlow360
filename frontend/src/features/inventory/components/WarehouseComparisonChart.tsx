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
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { WarehouseComparisonPoint } from "../types/inventory.types";

interface WarehouseComparisonChartProps {
  data: WarehouseComparisonPoint[];
  isLoading?: boolean;
}

export const WarehouseComparisonChart: React.FC<WarehouseComparisonChartProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <Card className="rounded-xl border border-slate-200/80 bg-white p-5 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-64 bg-slate-100 rounded" />
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Warehouse Comparison &amp; Capacity
            </CardTitle>
            <p className="text-[11px] text-slate-500">
              Available Stock vs Committed Reservations vs Hub Capacity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Reserved
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Capacity
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="code"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={{ stroke: "#CBD5E1" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: any, name: any) => [
                  `${Number(value).toLocaleString()} units`,
                  name === "availableStock"
                    ? "Available Stock"
                    : name === "reservedStock"
                    ? "Committed Reserved"
                    : "Total Capacity",
                ]}
                labelFormatter={(label) => {
                  const wh = data.find((d) => d.code === label);
                  return wh ? `${wh.warehouse} (${wh.code})` : String(label);
                }}
              />
              <Bar dataKey="availableStock" name="availableStock" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={38} />
              <Bar dataKey="reservedStock" name="reservedStock" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={38} />
              <Bar dataKey="totalCapacity" name="totalCapacity" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
