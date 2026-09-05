"use server";

import { revalidatePath } from "next/cache";
import {
  createDiscountPolicy,
  deleteDiscountPolicy,
  createApprovalRule,
  deleteApprovalRule,
} from "@/lib/services/governanceBridge";
import { getCurrentUser } from "@/lib/auth";

async function getAdminAuthContext() {
  try {
    const user = await getCurrentUser();
    if (user) {
      return {
        userId: user.id,
        role: "ADMIN",
        email: user.email || undefined,
      };
    }
  } catch {
    // Outside Next request context
  }
  return {
    userId: "admin-system",
    role: "ADMIN",
    email: "admin@dealflow360.in",
  };
}

export async function createDiscountPolicyAction(data: {
  name: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "TIERED" | "VOLUME";
  value: number;
  minOrderAmt?: number;
  maxDiscount?: number;
  tier?: string;
}) {
  const authContext = await getAdminAuthContext();
  const res = await createDiscountPolicy(data, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function deleteDiscountPolicyAction(id: string) {
  const authContext = await getAdminAuthContext();
  const res = await deleteDiscountPolicy(id, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function createApprovalRuleAction(data: {
  name: string;
  description?: string;
  stage: number;
  threshold: number;
  approverRole: "SALES_REP" | "MANAGER" | "FINANCE" | "ADMIN";
}) {
  const authContext = await getAdminAuthContext();
  const res = await createApprovalRule(data, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function deleteApprovalRuleAction(id: string) {
  const authContext = await getAdminAuthContext();
  const res = await deleteApprovalRule(id, authContext);
  revalidatePath("/configuration");
  return res;
}
