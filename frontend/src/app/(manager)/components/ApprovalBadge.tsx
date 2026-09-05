import React from "react";

interface ApprovalBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const normalized = status?.toUpperCase() || "PENDING";

  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let label = status;

  switch (normalized) {
    case "APPROVED":
      styles = "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]";
      label = "Approved";
      break;
    case "PENDING":
    case "PENDING_APPROVAL":
    case "IN_REVIEW":
    case "AWAITING REVIEW":
      styles = "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]";
      label = "Pending Review";
      break;
    case "REJECTED":
      styles = "bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]";
      label = "Rejected";
      break;
    case "CHANGES REQUESTED":
    case "CANCELLED":
    case "RETURNED":
      styles = "bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]";
      label = "Changes Requested";
      break;
    case "DRAFT":
      styles = "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]";
      label = "Draft";
      break;
    default:
      styles = "bg-slate-100 text-slate-700 border-slate-200";
  }

  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${styles} ${className}`}
    >
      {label}
    </span>
  );
};
