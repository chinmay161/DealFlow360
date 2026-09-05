"use client";

import React, { useState } from "react";
import { AlertTriangle, Sparkles, RefreshCw, Filter } from "lucide-react";
import { InventoryAlert } from "../components/InventoryAlert";
import { InventoryInsight } from "../components/InventoryInsight";
import { useInventoryAlerts, useInventoryInsights } from "../hooks/useInventoryAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "../components/LoadingSkeleton";

export const InventoryAlertsPage: React.FC = () => {
  const { data: alerts = [], isLoading: isAlertsLoading, refetch: refetchAlerts } = useInventoryAlerts();
  const { data: insights = [], isLoading: isInsightsLoading, refetch: refetchInsights } = useInventoryInsights();

  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const filteredAlerts = alerts.filter(
    (a) => severityFilter === "ALL" || a.severity === severityFilter
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Inventory Alerts &amp; Autonomous Business Insights
            </h2>
            <p className="text-xs text-slate-500">
              Real-time anomaly detection for low stock, depleted buffers, shipment delays, and high-volume reservations
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchAlerts();
            refetchInsights();
          }}
          className="text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh All</span>
        </Button>
      </div>

      {/* Autonomous Business Insights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Autonomous Business Insights
          </h3>
        </div>
        {isInsightsLoading ? <TableSkeleton rows={2} /> : <InventoryInsight insights={insights} />}
      </div>

      {/* Active Alerts Section */}
      <Card className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Active Stock &amp; Fulfillment Alerts ({filteredAlerts.length})
            </CardTitle>
            <p className="text-[11px] text-slate-500">
              Triaged by severity across all 3 regional distribution centers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Information</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isAlertsLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <InventoryAlert alerts={filteredAlerts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
