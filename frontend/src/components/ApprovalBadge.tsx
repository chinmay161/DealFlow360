import React from "react";
import { Badge } from "@/components/ui/badge";

interface ApprovalBadgeProps {
  level?: string | null;
  status?: string | null;
  className?: string;
}

export function ApprovalBadge({ level, status, className }: ApprovalBadgeProps) {
  const normStatus = (status || "").toUpperCase();
  const normLevel = (level || "").toUpperCase();

  // If quotation is fully approved or fulfilled
  if (normStatus === "APPROVED" || normLevel === "APPROVED" || normLevel.includes("ORDER CREATED") || normLevel.includes("FULFILLMENT")) {
    return (
      <Badge variant="success" className={className}>
        Approved
      </Badge>
    );
  }

  // If quotation is still in draft
  if (normStatus === "DRAFT" || normLevel === "DRAFT" || normLevel === "DRAFTING" || normLevel === "DRAFT CREATION") {
    return (
      <Badge variant="outline" className={className}>
        Drafting
      </Badge>
    );
  }

  // If quotation was rejected
  if (normStatus === "REJECTED" || normLevel === "REJECTED") {
    return (
      <Badge variant="destructive" className={className}>
        Rejected
      </Badge>
    );
  }

  // If quotation expired or cancelled
  if (normStatus === "EXPIRED" || normStatus === "CANCELLED" || normLevel === "CANCELLED") {
    return (
      <Badge variant="secondary" className={className}>
        No Active Approval
      </Badge>
    );
  }

  // Active approval stages
  if (normLevel.includes("FINANCE")) {
    return (
      <Badge variant="warning" className={className}>
        Finance Approval
      </Badge>
    );
  }

  if (normLevel.includes("VP") || normLevel.includes("EXECUTIVE") || normLevel.includes("DIRECTOR")) {
    return (
      <Badge variant="destructive" className={className}>
        Executive Approval
      </Badge>
    );
  }

  if (normLevel.includes("MANAGER") || normLevel.includes("PENDING") || normLevel.includes("REVIEW") || normLevel.includes("SALES")) {
    return (
      <Badge variant="info" className={className}>
        Manager Approval
      </Badge>
    );
  }

  if (normLevel.includes("AUTO")) {
    return (
      <Badge variant="success" className={className}>
        Fast-Track Auto
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      Standard
    </Badge>
  );
}
