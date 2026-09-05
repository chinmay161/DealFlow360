"use client";

import React from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-title-md text-title-md font-bold text-on-surface tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="font-body-sm text-[12px] text-outline mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="flex-1 w-full min-h-[240px] relative">{children}</div>
    </div>
  );
};
