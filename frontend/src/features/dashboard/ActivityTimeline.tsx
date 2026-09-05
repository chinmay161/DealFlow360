import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Timeline, TimelineItem } from "@/components/Timeline";
import type { ActivityTimelineItem } from "@/types/dashboard.types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ActivityTimelineProps {
  activities?: ActivityTimelineItem[];
}

export function ActivityTimeline({ activities = [] }: ActivityTimelineProps) {
  const mappedItems: TimelineItem[] = activities.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    timestamp: a.timestamp,
    actor: a.actorName,
    status:
      a.eventType === "APPROVED"
        ? "COMPLETED"
        : a.eventType === "APPROVAL_STARTED" || a.eventType === "EVALUATED"
        ? "CURRENT"
        : a.eventType === "REJECTED"
        ? "REJECTED"
        : "COMPLETED",
  }));

  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-sm font-semibold">Quotation Lifecycle Activity</CardTitle>
          <CardDescription>
            Chronological audit log: Creation → Rule Evaluation → Approval Routing → Sign-Off
          </CardDescription>
        </div>

        <Link
          href="/customer/quotations"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all deals <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent>
        {mappedItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No recent activity recorded yet.
          </div>
        ) : (
          <Timeline items={mappedItems} />
        )}
      </CardContent>
    </Card>
  );
}
