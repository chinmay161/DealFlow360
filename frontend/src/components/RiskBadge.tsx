import React from "react";
import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  score?: number | null;
  className?: string;
  showScore?: boolean;
}

export function RiskBadge({ score, className, showScore = true }: RiskBadgeProps) {
  const val = typeof score === "number" ? score : 25;

  if (val <= 30) {
    return (
      <Badge variant="success" className={className}>
        Low Risk {showScore && `(${val})`}
      </Badge>
    );
  }

  if (val <= 70) {
    return (
      <Badge variant="warning" className={className}>
        Medium Risk {showScore && `(${val})`}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className={className}>
      High Risk {showScore && `(${val})`}
    </Badge>
  );
}
