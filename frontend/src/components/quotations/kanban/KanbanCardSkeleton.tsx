"use client";

import React from "react";

export const KanbanCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-3 animate-pulse">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-4 w-16 bg-slate-200 rounded" />
      </div>

      {/* Customer */}
      <div className="space-y-1.5">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="h-3 w-28 bg-slate-100 rounded" />
      </div>

      {/* Financials */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="h-5 w-20 bg-slate-200 rounded" />
        <div className="h-4 w-12 bg-slate-100 rounded" />
      </div>

      {/* Inventory & Widgets */}
      <div className="h-10 bg-slate-100 rounded-lg" />

      {/* Badges */}
      <div className="flex items-center gap-2 pt-1">
        <div className="h-4 w-16 bg-slate-200 rounded-full" />
        <div className="h-4 w-20 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
};
