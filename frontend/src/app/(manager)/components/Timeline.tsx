"use client";

import React from "react";
import { Check, Clock, AlertCircle, Minus } from "lucide-react";

export interface TimelineStep {
  stage: number;
  role: string;
  approverName: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "SKIPPED";
  decidedAt?: string | null;
  comments?: string | null;
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ steps, className = "" }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          const isApproved = step.status === "APPROVED";
          const isPending = step.status === "PENDING";
          const isRejected = step.status === "REJECTED";
          const isSkipped = step.status === "SKIPPED";

          return (
            <div key={idx} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${
                  isApproved
                    ? "border-emerald-600 text-emerald-600"
                    : isRejected
                    ? "border-rose-600 text-rose-600"
                    : isPending
                    ? "border-amber-500 text-amber-500 animate-pulse"
                    : "border-slate-300 text-slate-300"
                }`}
              >
                {isApproved && <Check className="h-3 w-3 stroke-[3]" />}
                {isRejected && <AlertCircle className="h-3 w-3 stroke-[3]" />}
                {isPending && <Clock className="h-3 w-3 stroke-[2.5]" />}
                {isSkipped && <Minus className="h-3 w-3" />}
              </div>

              {/* Step Content */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">
                    Stage {step.stage}: {step.role}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isApproved
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : isRejected
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : isPending
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-outline">
                  <span>Reviewer: <strong className="text-on-surface font-medium">{step.approverName}</strong></span>
                  {step.decidedAt && (
                    <span className="text-[11px] text-slate-400">
                      {new Date(step.decidedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {step.comments && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 mt-2 border border-slate-100 italic">
                    &ldquo;{step.comments}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
