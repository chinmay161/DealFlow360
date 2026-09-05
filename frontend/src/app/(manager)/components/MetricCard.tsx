"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  footerLabel?: string;
  footerValue?: string;
  variant?: "default" | "warning" | "danger" | "success" | "info";
  href?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  footerLabel,
  footerValue,
  variant = "default",
  href,
  className = "",
}) => {
  const variantStyles = {
    default: {
      borderHover: "hover:border-primary/50",
      textHover: "group-hover:text-primary",
      iconColor: "text-outline group-hover:text-primary",
      valueColor: "text-on-surface",
    },
    warning: {
      borderHover: "hover:border-[#D97706]/50",
      textHover: "group-hover:text-[#D97706]",
      iconColor: "text-[#D97706]",
      valueColor: "text-on-surface",
    },
    danger: {
      borderHover: "hover:border-[#E11D48]/50",
      textHover: "group-hover:text-[#E11D48]",
      iconColor: "text-[#E11D48]",
      valueColor: "text-[#9F1239]",
    },
    success: {
      borderHover: "hover:border-[#059669]/50",
      textHover: "group-hover:text-[#059669]",
      iconColor: "text-[#059669]",
      valueColor: "text-[#065F46]",
    },
    info: {
      borderHover: "hover:border-[#2563EB]/50",
      textHover: "group-hover:text-[#2563EB]",
      iconColor: "text-[#2563EB]",
      valueColor: "text-on-surface",
    },
  }[variant];

  const content = (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between transition-colors duration-150 group ${variantStyles.borderHover} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`font-label-sm text-label-sm text-outline uppercase tracking-wider transition-colors ${variantStyles.textHover}`}
        >
          {title}
        </span>
        <div className={`text-base transition-colors ${variantStyles.iconColor}`}>
          {icon}
        </div>
      </div>

      <div className="my-2.5 flex items-baseline justify-between gap-2">
        <span
          className={`font-metric-display text-metric-display font-bold tnum tracking-tight ${variantStyles.valueColor}`}
        >
          {value}
        </span>

        {trend && (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border ${
              trend.isNeutral
                ? "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]"
                : trend.isPositive
                ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                : "bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]"
            }`}
          >
            {!trend.isNeutral && (
              trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )
            )}
            {trend.value}
          </span>
        )}
      </div>

      {(footerLabel || footerValue) && (
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between font-body-sm text-[11px] text-outline">
          <span>{footerLabel}</span>
          <span className="font-medium text-on-surface">{footerValue}</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
};
