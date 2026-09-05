"use server";

import { revalidatePath } from "next/cache";
import {
  ApproveActionSchema,
  RejectActionSchema,
  RequestChangesSchema,
} from "@/lib/validations/approval";
import { getCurrentUser } from "@/lib/auth";
import {
  approveApproval,
  rejectApproval,
  returnApproval,
} from "@/lib/services/governanceBridge";

async function getAuthContext() {
  try {
    const user = await getCurrentUser();
    if (user) {
      return {
        userId: user.id,
        role: (user as any).role || "APPROVER",
        email: user.email || undefined,
      };
    }
  } catch {
    // Outside Next request context
  }
  return {
    userId: "system-approver",
    role: "APPROVER",
    email: "approvals@dealflow360.in",
  };
}

export async function approveWorkflowAction(input: unknown) {
  const parsed = ApproveActionSchema.parse(input);
  const authContext = await getAuthContext();
  await approveApproval(parsed.approvalId, parsed.comments, authContext);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  revalidatePath("/overview");
  return { success: true };
}

export async function rejectWorkflowAction(input: unknown) {
  const parsed = RejectActionSchema.parse(input);
  const authContext = await getAuthContext();
  await rejectApproval(parsed.approvalId, parsed.reason, authContext);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  revalidatePath("/overview");
  return { success: true };
}

export async function requestChangesWorkflowAction(input: unknown) {
  const parsed = RequestChangesSchema.parse(input);
  const authContext = await getAuthContext();
  await returnApproval(parsed.approvalId, parsed.feedback, authContext);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  revalidatePath("/overview");
  return { success: true };
}
