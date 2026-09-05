import { formatIndianNumber } from "@/lib/currency";

export interface DealRiskAssessment {
  riskScore: number;
  riskLabel: "Low" | "Medium" | "High";
  requiredStage: string;
  reasons: string[];
  requiresApproval: boolean;
}

export interface LineRiskInput {
  productName: string;
  discountPercent: number;
  discountLimitPercent: number | null;
  governanceStatus?: string | null;
  lineTotal: number;
}

export function evaluateDealRisk(params: {
  subtotal: number;
  totalValue: number;
  estimatedMarginPercent: number;
  lines: LineRiskInput[];
}): DealRiskAssessment {
  const { subtotal, totalValue, estimatedMarginPercent, lines } = params;
  let score = 15; // baseline commercial risk
  const reasons: string[] = [];

  // 1. Line-level discount violations
  const violations = lines.filter(
    (l) =>
      (l.discountLimitPercent !== null && l.discountPercent > l.discountLimitPercent) ||
      (l.governanceStatus && l.governanceStatus.toLowerCase().includes("over"))
  );

  if (violations.length > 0) {
    score += Math.min(45, violations.length * 20);
    for (const v of violations) {
      reasons.push(
        `${v.productName}: Discount of ${v.discountPercent}% exceeds standard limit (${v.discountLimitPercent}%)`
      );
    }
  }

  // 2. Margin compression
  if (estimatedMarginPercent < 25) {
    score += 25;
    reasons.push(`Gross margin heavily compressed (${Math.round(estimatedMarginPercent)}% < 25% floor)`);
  } else if (estimatedMarginPercent < 35) {
    score += 15;
    reasons.push(`Gross margin compressed (${Math.round(estimatedMarginPercent)}% < 35% target)`);
  }

  // 3. Blended discount check
  const blendedDiscount = subtotal > 0 ? ((subtotal - totalValue) / subtotal) * 100 : 0;
  if (blendedDiscount > 20) {
    score += 15;
    reasons.push(`High aggregate package discount (${blendedDiscount.toFixed(1)}%)`);
  }

  // 4. Deal magnitude
  if (totalValue >= 10000000) {
    score += 15;
    reasons.push(`High-value enterprise contract (₹${formatIndianNumber(totalValue)})`);
  } else if (totalValue >= 5000000) {
    score += 10;
    reasons.push(`Significant commercial commitment (₹${formatIndianNumber(totalValue)})`);
  }

  // Bound score between 5 and 95
  const finalScore = Math.max(5, Math.min(95, score));
  const isHigh = finalScore >= 70;
  const isMedium = finalScore >= 40 && finalScore < 70;

  const riskLabel: "Low" | "Medium" | "High" = isHigh ? "High" : isMedium ? "Medium" : "Low";

  let requiredStage = "Drafting";
  if (finalScore >= 70) {
    requiredStage = "Finance Review";
  } else if (finalScore >= 40) {
    requiredStage = "Sales Review";
  } else if (violations.length > 0) {
    requiredStage = "Sales Review";
  }

  return {
    riskScore: finalScore,
    riskLabel,
    requiredStage,
    reasons,
    requiresApproval: finalScore >= 40 || violations.length > 0,
  };
}
