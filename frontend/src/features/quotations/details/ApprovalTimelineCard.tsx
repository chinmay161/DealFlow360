import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Timeline, TimelineItem } from "@/components/Timeline";
import { Users } from "lucide-react";
import type { QuotationWorkflowStatus } from "@/types/approval.types";

interface ApprovalTimelineCardProps {
  workflow?: QuotationWorkflowStatus;
  isLoading?: boolean;
}

export function ApprovalTimelineCard({
  workflow,
  isLoading = false,
}: ApprovalTimelineCardProps) {
  const steps = workflow?.steps || [];

  const timelineItems: TimelineItem[] = steps.map((step) => {
    const isCompleted = step.status === "APPROVED";
    const isPending = step.status === "PENDING";
    const isRejected = step.status === "REJECTED";

    return {
      id: step.id,
      title: step.stepName,
      description: step.comments || (isCompleted ? "Approved by authorized stakeholder" : "Awaiting review"),
      timestamp: step.decidedAt || undefined,
      actor: step.approverName || step.approverRole,
      status: isCompleted ? "COMPLETED" : isRejected ? "REJECTED" : isPending ? "CURRENT" : "PENDING",
    };
  });

  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm font-semibold">Approval Routing Progression</CardTitle>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Sequential Governance Flow: Submitted → Manager → Finance → Cleared
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading workflow routing...</div>
        ) : timelineItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No active approval steps recorded.
          </div>
        ) : (
          <Timeline items={timelineItems} />
        )}
      </CardContent>
    </Card>
  );
}
