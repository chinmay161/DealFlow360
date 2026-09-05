import React from "react";

export const SkeletonCard: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = "",
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-sm animate-pulse space-y-3 ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-slate-200 rounded"></div>
            <div className="h-4 w-4 bg-slate-200 rounded-full"></div>
          </div>
          <div className="h-7 w-32 bg-slate-200 rounded"></div>
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
            <div className="h-2.5 w-16 bg-slate-100 rounded"></div>
            <div className="h-2.5 w-20 bg-slate-100 rounded"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <div className="w-full bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-100 border-b border-[#E5E7EB] flex items-center px-4 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded flex-1"></div>
        ))}
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-14 flex items-center px-4 gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className={`h-3.5 bg-slate-100 rounded ${c === 0 ? "w-28 flex-initial" : "flex-1"}`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonChart: React.FC<{ height?: string }> = ({ height = "h-72" }) => {
  return (
    <div
      className={`w-full ${height} bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm animate-pulse flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-36 bg-slate-200 rounded"></div>
          <div className="h-2.5 w-52 bg-slate-100 rounded"></div>
        </div>
        <div className="h-6 w-20 bg-slate-100 rounded-md"></div>
      </div>
      <div className="flex items-end justify-between gap-3 h-44 pt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-100 rounded-t"
            style={{ height: `${Math.max(25, (i * 19 + 30) % 95)}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-2 w-8 bg-slate-200 rounded"></div>
        ))}
      </div>
    </div>
  );
};
