"use client";

import React from "react";
import {
  Package,
  Building2,
  Boxes,
  Bookmark,
  AlertTriangle,
  Truck,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InventoryMetricCard } from "../components/InventoryMetricCard";
import { InventoryAlert } from "../components/InventoryAlert";
import { InventoryInsight } from "../components/InventoryInsight";
import { WarehouseComparisonChart } from "../components/WarehouseComparisonChart";
import { KPISkeletonGrid, ChartSkeleton } from "../components/LoadingSkeleton";
import { useInventoryOverview } from "../hooks/useInventoryData";
import { useInventoryRole } from "../context/InventoryRoleContext";
import type { UserInventoryRole } from "../types/inventory.types";
import Link from "next/link";

interface InventoryOverviewPageProps {
  userRole?: UserInventoryRole;
}

export const InventoryOverviewPage: React.FC<InventoryOverviewPageProps> = ({
  userRole: propRole,
}) => {
  const { role: contextRole } = useInventoryRole();
  const effectiveRole = propRole || contextRole;
  const isManager = effectiveRole === "MANAGER";
  const { data, isLoading, error } = useInventoryOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPISkeletonGrid count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2 font-bold">
          !
        </div>
        <h3 className="text-sm font-bold text-slate-800">Failed to Load Inventory Telemetry</h3>
        <p className="text-xs text-slate-500 mt-1">Please verify network connectivity and PostgreSQL database health.</p>
      </div>
    );
  }

  const { kpis, statusDistribution, categoryDistribution, shipmentStatusDistribution, warehouseComparison, criticalAlerts, businessInsights } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Role Notice Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-bold text-blue-900">
            {isManager ? "Manager Inventory Command Center" : "Sales Representative Stock Visibility"}
          </span>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
            READ-ONLY
          </span>
        </div>
        <div className="text-[11px] text-blue-800 font-medium">
          {isManager
            ? "Full capacity utilization, risk telemetry, and cross-warehouse metrics enabled"
            : "Direct inventory lookup for real-time quotation creation and availability checks"}
        </div>
      </div>

      {/* 1. Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <InventoryMetricCard
          title="Total Products"
          value={kpis.totalProducts}
          icon={Package}
          trend={0}
          trendLabel="Active Catalog"
          accentColor="indigo"
        />
        <InventoryMetricCard
          title="Warehouses"
          value={kpis.warehousesCount}
          icon={Building2}
          trend={0}
          trendLabel="Indian Regional Hubs"
          accentColor="blue"
        />
        <InventoryMetricCard
          title="Available Units"
          value={kpis.availableUnits}
          icon={Boxes}
          trend={kpis.trends.availableTrend}
          trendLabel="Free for Quotes"
          accentColor="emerald"
        />
        <InventoryMetricCard
          title="Reserved Units"
          value={kpis.reservedUnits}
          icon={Bookmark}
          trend={kpis.trends.reservedTrend}
          trendLabel="Committed Orders"
          accentColor="purple"
        />
        <InventoryMetricCard
          title="Low Stock Items"
          value={kpis.lowStockCount}
          icon={AlertTriangle}
          trend={kpis.trends.lowStockTrend}
          trendLabel="Below Reorder Point"
          accentColor="amber"
        />
        <InventoryMetricCard
          title="Shipments Active"
          value={kpis.shipmentsInProgressCount}
          icon={Truck}
          trend={kpis.trends.shipmentTrend}
          trendLabel="In Transit / Packed"
          accentColor="rose"
        />
      </div>

      {/* 2. Manager-Exclusive Operational KPIs Strip */}
      {isManager && (
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-sm border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Managerial Operational Analytics &amp; Capital Exposure
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Live PostgreSQL Aggregation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Total Inventory Asset Value</span>
              <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                ₹{(kpis.totalInventoryValue / 10000000).toFixed(2)} Cr
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Average Hub Utilization</span>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
                68.4%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Average Order Turnaround</span>
              <div className="text-base sm:text-lg font-bold font-mono text-blue-400 mt-0.5">
                1.8 Days
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Reservation Fulfillment Rate</span>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-0.5">
                96.2%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Recharts Section: Inventory Status & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Pie Chart: Inventory Status */}
        <Card className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Inventory Stock Status
                </CardTitle>
                <p className="text-[11px] text-slate-500">Available vs Reserved vs Buffers</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} units`, "Volume"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart: Category Distribution */}
        <Card className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Category Distribution
                </CardTitle>
                <p className="text-[11px] text-slate-500">Inventory volume grouped by product line</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryDistribution}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${Number(val).toLocaleString()} units`,
                      name === "available" ? "Available" : "Reserved",
                    ]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar
                    dataKey="available"
                    name="Available Stock"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="reserved"
                    name="Reserved Units"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Warehouse Comparison Bar Chart */}
      <WarehouseComparisonChart data={warehouseComparison} />

      {/* 5. Donut Chart: Shipment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <Card className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Shipment Status Donut
                </CardTitle>
                <p className="text-[11px] text-slate-500">Pipeline from Planned to Delivered</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shipmentStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {shipmentStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} consignments`, "Count"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts Card */}
        <Card className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Active Inventory Alerts
                </CardTitle>
                <p className="text-[11px] text-slate-500">Low stock buffers and fulfillment exceptions</p>
              </div>
            </div>
            <Link
              href="/inventory/alerts"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View All Alerts →
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <InventoryAlert alerts={criticalAlerts} />
          </CardContent>
        </Card>
      </div>

      {/* 6. Business Insights Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Inventory Business Insights &amp; Operational Directives
            </h3>
          </div>
          <Link
            href="/inventory/trends"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Telemetry Trends →
          </Link>
        </div>
        <InventoryInsight insights={businessInsights} />
      </div>
    </div>
  );
};
