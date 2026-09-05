import React from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface InventoryMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  accentColor?: "blue" | "emerald" | "amber" | "rose" | "purple" | "indigo";
}

export const InventoryMetricCard: React.FC<InventoryMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = "vs last month",
  subtitle,
  accentColor = "blue",
}) => {
  const colorMap = {
    blue: {
      bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60",
      iconBg: "bg-blue-600 text-white",
    },
    emerald: {
      bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60",
      iconBg: "bg-emerald-600 text-white",
    },
    amber: {
      bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60",
      iconBg: "bg-amber-600 text-white",
    },
    rose: {
      bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60",
      iconBg: "bg-rose-600 text-white",
    },
    purple: {
      bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60",
      iconBg: "bg-purple-600 text-white",
    },
    indigo: {
      bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60",
      iconBg: "bg-indigo-600 text-white",
    },
  };

  const selectedColor = colorMap[accentColor] || colorMap.blue;

  return (
    <Card className="p-4 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${selectedColor.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          {typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </div>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              trend > 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : trend < 0
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-600" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3 text-rose-600" />
            ) : (
              <Minus className="w-3 h-3 text-slate-500" />
            )}
            <span>
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{subtitle || trendLabel}</span>
      </div>
    </Card>
  );
};
