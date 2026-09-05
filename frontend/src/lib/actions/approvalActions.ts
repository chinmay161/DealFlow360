"use server";

import { revalidatePath } from "next/cache";
import {
  ApproveActionSchema,
  RejectActionSchema,
  RequestChangesSchema,
} from "@/lib/validations/approval";
import {
  approveWorkflowStep,
  rejectWorkflow,
  requestChangesWorkflow,
} from "@/lib/services/approvalService";

export async function approveWorkflowAction(input: unknown) {
  const parsed = ApproveActionSchema.parse(input);
  await approveWorkflowStep(parsed.approvalId, parsed.comments);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectWorkflowAction(input: unknown) {
  const parsed = RejectActionSchema.parse(input);
  await rejectWorkflow(parsed.approvalId, parsed.reason);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function requestChangesWorkflowAction(input: unknown) {
  const parsed = RequestChangesSchema.parse(input);
  await requestChangesWorkflow(parsed.approvalId, parsed.feedback);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  return { success: true };
}
