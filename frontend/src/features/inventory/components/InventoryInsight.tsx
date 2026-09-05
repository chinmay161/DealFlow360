import React from "react";
import { Sparkles, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import type { InventoryInsightItem } from "../types/inventory.types";

interface InventoryInsightProps {
  insights: InventoryInsightItem[];
}

export const InventoryInsight: React.FC<InventoryInsightProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  const getImpactBadge = (impact: InventoryInsightItem["impact"]) => {
    switch (impact) {
      case "POSITIVE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case "NEGATIVE":
        return <TrendingDown className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      case "NEUTRAL":
      default:
        return <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {insights.map((ins) => (
        <div
          key={ins.id}
          className="p-3.5 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {ins.category} INSIGHT
                </span>
              </div>
              {ins.metric && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {ins.metric}
                </span>
              )}
            </div>

            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
              {ins.title}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
              {ins.description}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              {getImpactBadge(ins.impact)}
              <span>{ins.impact === "POSITIVE" ? "Favorable Velocity" : ins.impact === "NEGATIVE" ? "Attention Advised" : "Stable Throughput"}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
