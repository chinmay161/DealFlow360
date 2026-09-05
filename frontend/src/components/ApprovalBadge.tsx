import React from "react";
import { Badge } from "@/components/ui/badge";

interface ApprovalBadgeProps {
  level?: string | null;
  className?: string;
}

export function ApprovalBadge({ level, className }: ApprovalBadgeProps) {
  const norm = (level || "AUTO").toUpperCase();

  if (norm.includes("AUTO")) {
    return (
      <Badge variant="success" className={className}>
        Fast-Track Auto
      </Badge>
    );
  }

  if (norm.includes("FINANCE")) {
    return (
      <Badge variant="warning" className={className}>
        Finance Review
      </Badge>
    );
  }

  if (norm.includes("VP") || norm.includes("EXECUTIVE") || norm.includes("DIRECTOR")) {
    return (
      <Badge variant="destructive" className={className}>
        Executive VP Sign-Off
      </Badge>
    );
  }

  return (
    <Badge variant="info" className={className}>
      Manager Approval
    </Badge>
  );
}
