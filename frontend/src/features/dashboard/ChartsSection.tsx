"use client";

import React, { useState, useEffect } from "react";
import { ChartCard } from "@/components/ChartCard";
import { ChartSkeleton } from "@/components/LoadingSkeleton";
import type {
  StatusDistributionItem,
  MonthlyQuotationData,
  RevenueTrendData,
} from "@/types/dashboard.types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";

interface ChartsSectionProps {
  statusDistribution?: StatusDistributionItem[];
  monthlyQuotations?: MonthlyQuotationData[];
  revenueTrend?: RevenueTrendData[];
  isLoading?: boolean;
}

export function ChartsSection({
  statusDistribution,
  monthlyQuotations,
  revenueTrend,
  isLoading = false,
}: ChartsSectionProps) {
  // Prevent SSR hydration mismatch for Recharts responsive containers
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  const pieData = statusDistribution || [
    { status: "Approved", count: 6, color: "#10b981" },
    { status: "Pending Review", count: 4, color: "#f59e0b" },
    { status: "Drafts", count: 3, color: "#3b82f6" },
    { status: "Rejected", count: 2, color: "#ef4444" },
  ];

  const barData = monthlyQuotations || [
    { month: "Jan", total: 8, approved: 5, pending: 2 },
    { month: "Feb", total: 11, approved: 7, pending: 3 },
    { month: "Mar", total: 14, approved: 9, pending: 3 },
    { month: "Apr", total: 10, approved: 6, pending: 2 },
    { month: "May", total: 16, approved: 11, pending: 4 },
    { month: "Jun", total: 13, approved: 8, pending: 4 },
  ];

  const areaData = revenueTrend || [
    { date: "Week 1", grossValue: 1250000, approvedValue: 980000 },
    { date: "Week 2", grossValue: 1840000, approvedValue: 1420000 },
    { date: "Week 3", grossValue: 2450000, approvedValue: 2100000 },
    { date: "Week 4", grossValue: 3890000, approvedValue: 3250000 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Quotation Status Distribution (Donut Chart) */}
      <ChartCard
        title="Status Distribution"
        description="Deal breakdown by current state"
      >
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${value} Quotations`, "Count"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 2. Monthly Quotations (Bar Chart) */}
      <ChartCard
        title="Monthly Quotations"
        description="Volume progression over H1 2026"
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 3. Revenue Trend (Area Chart) */}
      <ChartCard
        title="Revenue Trend"
        description="Gross value vs Approved pipeline (₹)"
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip
                formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Value"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="grossValue"
                name="Gross Deal Value"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorGross)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="approvedValue"
                name="Approved Revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorApproved)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
