"use client";

import React, { useState } from "react";
import { ApprovalItem } from "@/types/approval";
import { ApprovalQueue } from "./ApprovalQueue";
import { ApprovalDetails } from "./ApprovalDetails";
import {
  approveWorkflowAction,
  rejectWorkflowAction,
  requestChangesWorkflowAction,
} from "@/lib/actions/approvalActions";

interface ApprovalsWorkspaceProps {
  initialItems?: ApprovalItem[];
}

export const ApprovalsWorkspace: React.FC<ApprovalsWorkspaceProps> = ({
  initialItems = [],
}) => {
  const [items, setItems] = useState<ApprovalItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string>(initialItems[0]?.id || "");

  const selectedApproval =
    items.find((it) => it.id === selectedId) || items[0];

  const handleApprove = async (id: string) => {
    try {
      await approveWorkflowAction({
        approvalId: id,
        comments: "Approved via commercial approvals console.",
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "Approved" } : item
        )
      );
    } catch (err) {
      console.error("Approval action failed:", err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectWorkflowAction({
        approvalId: id,
        reason: "Deal margin/discount terms declined in commercial governance review.",
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "Rejected" } : item
        )
      );
    } catch (err) {
      console.error("Rejection action failed:", err);
    }
  };

  const handleRequestChanges = async (id: string) => {
    try {
      await requestChangesWorkflowAction({
        approvalId: id,
        feedback: "Please adjust hardware discounts to stay within standard account margin envelope.",
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "Changes Requested" } : item
        )
      );
    } catch (err) {
      console.error("Request changes action failed:", err);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center text-outline">
        No approvals currently in the queue.
      </div>
    );
  }

  return (
    <div className="flex gap-space-base items-start">
      {/* LEFT SIDE: APPROVAL QUEUE (~62% width) */}
      <div className="w-[62%] shrink-0">
        <ApprovalQueue
          items={items}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
        />
      </div>

      {/* RIGHT SIDE: APPROVAL DETAILS (~38% width) */}
      <div className="w-[38%] flex-1 sticky top-0">
        {selectedApproval && (
          <ApprovalDetails
            approval={selectedApproval}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestChanges={handleRequestChanges}
          />
        )}
      </div>
    </div>
  );
};
