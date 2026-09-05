import React from "react";
import { Card } from "@/components/ui/card";
import { Clock, Package, Truck, CheckCircle2, XCircle } from "lucide-react";
import type { ShipmentRecord } from "../types/inventory.types";

interface ShipmentStatusCardsProps {
  shipments?: ShipmentRecord[];
  activeFilter?: string;
  onFilterClick?: (status: string) => void;
  isLoading?: boolean;
}

export const ShipmentStatusCards: React.FC<ShipmentStatusCardsProps> = ({
  shipments = [],
  activeFilter = "ALL",
  onFilterClick,
  isLoading = false,
}) => {
  // Aggregate counts by status
  const pendingCount = shipments.filter(
    (s) => s.status === "PLANNED" || s.status === "READY"
  ).length;
  const packedCount = shipments.filter((s) => s.status === "PACKED").length;
  const inTransitCount = shipments.filter(
    (s) => s.status === "SHIPPED" || s.status === "IN_TRANSIT"
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;
  const cancelledCount = shipments.filter((s) => s.status === "CANCELLED").length;

  const kpis = [
    {
      id: "PLANNED",
      title: "Pending Shipments",
      count: pendingCount,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      activeRing: "ring-2 ring-amber-400",
    },
    {
      id: "PACKED",
      title: "Packed",
      count: packedCount,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      activeRing: "ring-2 ring-purple-400",
    },
    {
      id: "IN_TRANSIT",
      title: "In Transit",
      count: inTransitCount,
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      activeRing: "ring-2 ring-blue-400",
    },
    {
      id: "DELIVERED",
      title: "Delivered",
      count: deliveredCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      activeRing: "ring-2 ring-emerald-400",
    },
    {
      id: "CANCELLED",
      title: "Cancelled",
      count: cancelledCount,
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      activeRing: "ring-2 ring-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isActive = activeFilter === kpi.id;

        return (
          <Card
            key={kpi.id}
            onClick={() => onFilterClick?.(activeFilter === kpi.id ? "ALL" : kpi.id)}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              isActive ? `${kpi.borderColor} ${kpi.activeRing} bg-white shadow-xs` : "border-slate-200/80 bg-white hover:border-slate-300"
            } ${onFilterClick ? "cursor-pointer hover:shadow-xs" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 line-clamp-1">
                {kpi.title}
              </span>
              <div className={`w-7 h-7 rounded-lg ${kpi.bgColor} ${kpi.color} flex items-center justify-center font-bold`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-slate-900">
                {isLoading ? "—" : kpi.count}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">consignments</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
