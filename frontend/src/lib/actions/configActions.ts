"use server";

import { revalidatePath } from "next/cache";
import {
  createDiscountPolicy,
  updateDiscountPolicy,
  deleteDiscountPolicy,
  createApprovalRule,
  updateApprovalRule,
  deleteApprovalRule,
} from "@/lib/services/governanceBridge";
import { getCurrentUser } from "@/lib/auth";

/**
 * Enforce role-based permissions: Only Managers and Admins are permitted to perform write operations.
 * Sales Representatives (and unauthenticated / unauthorized callers) receive a 403 Forbidden error.
 */
async function requireManagerAuthContext() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("401 Unauthorized: Authentication required to modify policies.");
  }

  const role = (user.role || "").toUpperCase();
  if (role !== "MANAGER" && role !== "ADMIN") {
    throw new Error("403 Forbidden: Access denied. Only Managers are authorized to create or modify policies.");
  }

  return {
    userId: user.id || "manager-user",
    role: role,
    email: user.email || undefined,
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
  const authContext = await requireManagerAuthContext();
  const res = await createDiscountPolicy(data, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function updateDiscountPolicyAction(
  id: string,
  data: {
    name?: string;
    description?: string;
    type?: "PERCENTAGE" | "FIXED_AMOUNT" | "TIERED" | "VOLUME";
    value?: number;
    minOrderAmt?: number;
    maxDiscount?: number;
    tier?: string;
    isActive?: boolean;
  }
) {
  const authContext = await requireManagerAuthContext();
  const res = await updateDiscountPolicy(id, data, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function toggleDiscountPolicyAction(id: string, isActive: boolean) {
  const authContext = await requireManagerAuthContext();
  const res = await updateDiscountPolicy(id, { isActive }, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function deleteDiscountPolicyAction(id: string) {
  const authContext = await requireManagerAuthContext();
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
  const authContext = await requireManagerAuthContext();
  const res = await createApprovalRule(data, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function updateApprovalRuleAction(
  id: string,
  data: {
    name?: string;
    description?: string;
    stage?: number;
    threshold?: number;
    approverRole?: "SALES_REP" | "MANAGER" | "FINANCE" | "ADMIN";
    isActive?: boolean;
  }
) {
  const authContext = await requireManagerAuthContext();
  const res = await updateApprovalRule(id, data, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function toggleApprovalRuleAction(id: string, isActive: boolean) {
  const authContext = await requireManagerAuthContext();
  const res = await updateApprovalRule(id, { isActive }, authContext);
  revalidatePath("/configuration");
  return res;
}

export async function deleteApprovalRuleAction(id: string) {
  const authContext = await requireManagerAuthContext();
  const res = await deleteApprovalRule(id, authContext);
  revalidatePath("/configuration");
  return res;
}
