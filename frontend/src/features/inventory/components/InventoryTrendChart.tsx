"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface InventoryTrendChartProps {
  data?: {
    stockTrend?: any[];
    reservationTrend?: any[];
    shipmentTrend?: any[];
    categoryTrend?: any[];
  };
  isLoading?: boolean;
}

export const InventoryTrendChart: React.FC<InventoryTrendChartProps> = ({
  data,
}) => {
  const [activeTab, setActiveTab] = useState<"stock" | "reservations" | "shipments" | "categories">("stock");

  // Fallback sample data if not yet loaded
  const stockTrend = data?.stockTrend || [
    { date: "Day 1", onHand: 2450, available: 2150, reserved: 300 },
    { date: "Day 5", onHand: 2420, available: 2080, reserved: 340 },
    { date: "Day 10", onHand: 2380, available: 2010, reserved: 370 },
    { date: "Day 15", onHand: 2510, available: 2100, reserved: 410 },
    { date: "Day 20", onHand: 2480, available: 2040, reserved: 440 },
    { date: "Day 25", onHand: 2420, available: 1960, reserved: 460 },
    { date: "Day 30", onHand: 2390, available: 1890, reserved: 500 },
  ];

  const reservationTrend = data?.reservationTrend || [
    { date: "Wk 1", confirmed: 140, fulfilled: 95, pending: 30 },
    { date: "Wk 2", confirmed: 195, fulfilled: 130, pending: 45 },
    { date: "Wk 3", confirmed: 240, fulfilled: 175, pending: 55 },
    { date: "Wk 4", confirmed: 290, fulfilled: 215, pending: 65 },
  ];

  const shipmentTrend = data?.shipmentTrend || [
    { date: "Wk 1", delivered: 42, inTransit: 18, planned: 12 },
    { date: "Wk 2", delivered: 56, inTransit: 24, planned: 15 },
    { date: "Wk 3", delivered: 71, inTransit: 29, planned: 19 },
    { date: "Wk 4", delivered: 88, inTransit: 35, planned: 22 },
  ];

  const categoryTrend = data?.categoryTrend || [
    { date: "Month 1", hardware: 1200, peripherals: 850, accessories: 400 },
    { date: "Month 2", hardware: 1150, peripherals: 920, accessories: 420 },
    { date: "Month 3", hardware: 1080, peripherals: 990, accessories: 450 },
  ];

  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Inventory Trends &amp; Telemetry
            </CardTitle>
            <p className="text-[11px] text-slate-500">
              Operational time-series tracking across stock, commitments, and fulfillment
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "stock"
                ? "bg-white text-blue-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Stock Levels
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "reservations"
                ? "bg-white text-blue-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Reservations
          </button>
          <button
            onClick={() => setActiveTab("shipments")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "shipments"
                ? "bg-white text-blue-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Shipments
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "categories"
                ? "bg-white text-blue-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Categories
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "stock" ? (
              <AreaChart data={stockTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area
                  type="monotone"
                  dataKey="available"
                  name="Available Units"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#availGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="reserved"
                  name="Reserved Units"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#resGrad)"
                />
              </AreaChart>
            ) : activeTab === "reservations" ? (
              <LineChart data={reservationTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="confirmed"
                  name="Confirmed (Locked)"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="fulfilled"
                  name="Fulfilled"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  name="Pending Review"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            ) : activeTab === "shipments" ? (
              <BarChart data={shipmentTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="delivered" name="Delivered" fill="#10B981" stackId="a" maxBarSize={32} />
                <Bar dataKey="inTransit" name="In Transit" fill="#3B82F6" stackId="a" maxBarSize={32} />
                <Bar dataKey="planned" name="Planned / Ready" fill="#CBD5E1" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            ) : (
              <AreaChart data={categoryTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area
                  type="monotone"
                  dataKey="hardware"
                  name="Hardware"
                  stroke="#2563EB"
                  fill="#93C5FD"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="peripherals"
                  name="Peripherals & Displays"
                  stroke="#7C3AED"
                  fill="#DDD6FE"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="accessories"
                  name="Accessories & Power"
                  stroke="#059669"
                  fill="#A7F3D0"
                  stackId="1"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
