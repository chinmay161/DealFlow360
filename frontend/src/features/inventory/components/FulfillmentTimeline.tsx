import React from "react";
import { Check, Clock } from "lucide-react";

export type FulfillmentStage =
  | "SUBMITTED"
  | "APPROVED"
  | "RESERVED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED";

interface FulfillmentTimelineProps {
  currentStage?: FulfillmentStage;
  className?: string;
}

const STAGES: Array<{ id: FulfillmentStage; label: string; description: string }> = [
  { id: "SUBMITTED", label: "Quotation Submitted", description: "Deal initialized" },
  { id: "APPROVED", label: "Approved", description: "Commercial governance clearance" },
  { id: "RESERVED", label: "Inventory Reserved", description: "Warehouse stock committed" },
  { id: "PACKED", label: "Packed", description: "Consignment staged" },
  { id: "SHIPPED", label: "Shipped", description: "Handed to regional carrier" },
  { id: "DELIVERED", label: "Delivered", description: "Customer receipt confirmed" },
];

export const FulfillmentTimeline: React.FC<FulfillmentTimelineProps> = ({
  currentStage = "SUBMITTED",
  className = "",
}) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-xs text-slate-900">
            End-to-End Quotation Fulfillment Timeline
          </h4>
        </div>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
          Stage {activeIdx + 1} of {STAGES.length}
        </span>
      </div>

      <div className="relative py-2">
        {/* Progress connector line */}
        <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0 hidden sm:block" />
        <div
          className="absolute top-5 left-4 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500 hidden sm:block"
          style={{
            width: `calc(${(activeIdx / (STAGES.length - 1)) * 100}% - 2rem)`,
          }}
        />

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 relative z-10">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center text-center space-y-1.5"
              >
                {/* Node icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-xs"
                      : isCurrent
                      ? "bg-primary text-white ring-4 ring-primary/20 shadow-xs animate-pulse"
                      : "bg-white border-2 border-slate-300 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold">{idx + 1}</span>
                  )}
                </div>

                <div>
                  <span
                    className={`font-semibold text-[11px] block leading-tight ${
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="text-[9px] text-slate-500 hidden sm:block mt-0.5 leading-tight">
                    {stage.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
