import { z } from "zod";

export const ApproveActionSchema = z.object({
  approvalId: z.string().uuid("Invalid approval ID"),
  stepId: z.string().uuid("Invalid step ID").optional(),
  comments: z.string().max(1000).optional(),
});

export type ApproveActionInput = z.infer<typeof ApproveActionSchema>;

export const RejectActionSchema = z.object({
  approvalId: z.string().uuid("Invalid approval ID"),
  stepId: z.string().uuid("Invalid step ID").optional(),
  reason: z.string().min(3, "Rejection reason is required").max(1000),
});

export type RejectActionInput = z.infer<typeof RejectActionSchema>;

export const RequestChangesSchema = z.object({
  approvalId: z.string().uuid("Invalid approval ID"),
  stepId: z.string().uuid("Invalid step ID").optional(),
  feedback: z.string().min(3, "Feedback is required").max(1000),
});

export type RequestChangesInput = z.infer<typeof RequestChangesSchema>;
