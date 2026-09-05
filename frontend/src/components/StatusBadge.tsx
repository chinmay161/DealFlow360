import React from "react";
import { Badge } from "@/components/ui/badge";
import type { QuotationStatus } from "@/types/quotation.types";

interface StatusBadgeProps {
  status: QuotationStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  if (norm === "APPROVED") {
    return (
      <Badge variant="success" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
        Approved
      </Badge>
    );
  }

  if (norm === "IN_REVIEW" || norm === "PENDING_APPROVAL" || norm === "PENDING") {
    return (
      <Badge variant="warning" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
        Pending Review
      </Badge>
    );
  }

  if (norm === "REJECTED") {
    return (
      <Badge variant="destructive" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
        Rejected
      </Badge>
    );
  }

  if (norm === "EXPIRED" || norm === "CANCELLED") {
    return (
      <Badge variant="secondary" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
        Expired
      </Badge>
    );
  }

  return (
    <Badge variant="info" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
      Draft
    </Badge>
  );
}
