import React from "react";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

interface RiskBadgeProps {
  score: number;
  showScore?: boolean;
  category?: "High" | "Medium" | "Low";
  size?: "sm" | "md";
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  score,
  showScore = true,
  category,
  size = "md",
  className = "",
}) => {
  const derivedCategory = category || (score >= 70 ? "High" : score >= 40 ? "Medium" : "Low");

  let colorClasses = "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]";
  let icon = <ShieldCheck className="h-3 w-3 text-[#059669]" />;
  let label = "Low Risk";

  if (derivedCategory === "High") {
    colorClasses = "bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]";
    icon = <ShieldAlert className="h-3 w-3 text-[#E11D48]" />;
    label = "High Risk";
  } else if (derivedCategory === "Medium") {
    colorClasses = "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]";
    icon = <Shield className="h-3 w-3 text-[#D97706]" />;
    label = "Medium Risk";
  }

  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeClass} ${colorClasses} ${className}`}
      title={`Risk Score: ${score}/100`}
    >
      {icon}
      <span>{label}</span>
      {showScore && <span className="opacity-75 tnum font-normal">({score})</span>}
    </span>
  );
};
