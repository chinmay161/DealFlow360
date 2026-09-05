"use client";

import React from "react";
import { FileText, Cpu, CheckCircle, ArrowRightLeft, UserCheck } from "lucide-react";

export interface AuditTimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  actor: string;
  role: string;
  type: string;
}

interface AuditTimelineProps {
  events: AuditTimelineEvent[];
  className?: string;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events, className = "" }) => {
  const getIcon = (type: string) => {
    if (type.includes("CREATED")) return <FileText className="h-3.5 w-3.5 text-blue-600" />;
    if (type.includes("EVALUATION") || type.includes("RULE")) return <Cpu className="h-3.5 w-3.5 text-purple-600" />;
    if (type.includes("APPROVED")) return <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />;
    if (type.includes("TRANSITION")) return <ArrowRightLeft className="h-3.5 w-3.5 text-amber-600" />;
    return <UserCheck className="h-3.5 w-3.5 text-slate-600" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((event) => (
          <div key={event.id} className="relative">
            {/* Dot Icon */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center">
              {getIcon(event.type)}
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface">{event.title}</span>
                <span className="text-[11px] text-slate-400">
                  {new Date(event.time).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-outline">{event.description}</p>
              <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                <span>By {event.actor}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                  {event.role}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
