import React from "react";
import { cn } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  actor?: string;
  status: "COMPLETED" | "CURRENT" | "PENDING" | "REJECTED" | "WARNING";
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6", className)}>
      {items.map((item, idx) => {
        const isCompleted = item.status === "COMPLETED";
        const isCurrent = item.status === "CURRENT";
        const isRejected = item.status === "REJECTED";
        const isWarning = item.status === "WARNING";

        return (
          <div key={item.id || idx} className="relative group">
            {/* Timeline node icon */}
            <div
              className={cn(
                "absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white text-white dark:bg-slate-950 transition-all",
                isCompleted
                  ? "border-emerald-500 text-emerald-600 shadow-sm shadow-emerald-500/20"
                  : isCurrent
                  ? "border-blue-500 text-blue-600 shadow-sm shadow-blue-500/20 animate-pulse"
                  : isRejected
                  ? "border-rose-500 text-rose-600"
                  : isWarning
                  ? "border-amber-500 text-amber-600"
                  : "border-slate-300 text-slate-400 dark:border-slate-700"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
              ) : isCurrent ? (
                <Clock className="h-3.5 w-3.5 text-blue-600" />
              ) : isRejected ? (
                <XCircle className="h-3.5 w-3.5 fill-rose-500 text-white" />
              ) : isWarning ? (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.title}
              </h4>
              {item.timestamp && (
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            )}

            {item.actor && (
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                By <span className="text-slate-700 dark:text-slate-300">{item.actor}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
