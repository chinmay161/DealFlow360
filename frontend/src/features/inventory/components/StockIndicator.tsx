import React from "react";

interface StockIndicatorProps {
  freeStock: number;
  threshold?: number;
  className?: string;
  showCount?: boolean;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  freeStock,
  threshold = 10,
  className = "",
  showCount = true,
}) => {
  let label = "In Stock";
  let dotColor = "bg-emerald-500";
  let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (freeStock <= 0) {
    label = "Out of Stock";
    dotColor = "bg-rose-500";
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (freeStock <= threshold) {
    label = "Low Stock";
    dotColor = "bg-amber-500";
    badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle} ${className}`}
      title={`${label} (${freeStock} free units available)`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0 animate-pulse`} />
      <span>{label}</span>
      {showCount && (
        <span className="font-mono text-[10px] opacity-80">
          ({freeStock.toLocaleString()} free)
        </span>
      )}
    </span>
  );
};
