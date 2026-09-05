import { prisma } from "@/lib/prisma";
import { CustomerTier } from "@prisma/client";

export interface DiscountEvaluation {
  allowedLimitPercent: number;
  isViolation: boolean;
  governanceStatus: string;
  ruleCode?: string;
}

export async function evaluateDiscountGovernance(
  customerTier: CustomerTier,
  productId: string,
  requestedDiscountPercent: number
): Promise<DiscountEvaluation> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  const rules = await prisma.discountRule.findMany({
    where: {
      isActive: true,
      OR: [
        { tier: customerTier },
        { tier: null },
      ],
    },
    orderBy: { maxDiscountPercent: "asc" },
  });

  // Find most applicable rule
  let matchedRule = rules.find((r) => r.category && product?.category && r.category === product.category.name);
  if (!matchedRule) {
    matchedRule = rules.find((r) => r.tier === customerTier);
  }
  if (!matchedRule) {
    matchedRule = rules[0];
  }

  const allowedLimitPercent = matchedRule ? Number(matchedRule.maxDiscountPercent) : 15;
  const isViolation = requestedDiscountPercent > allowedLimitPercent;
  const governanceStatus = isViolation ? "Over Limit" : "Within Limit";

  return {
    allowedLimitPercent,
    isViolation,
    governanceStatus,
    ruleCode: matchedRule?.code,
  };
}
