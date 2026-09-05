"use client";

import React, { useState } from "react";
import { ApprovalItem } from "@/types/approval";
import { MOCK_APPROVAL_ITEMS } from "@/lib/mock-approvals";
import { ApprovalQueue } from "./ApprovalQueue";
import { ApprovalDetails } from "./ApprovalDetails";

interface ApprovalsWorkspaceProps {
  initialItems?: ApprovalItem[];
}

export const ApprovalsWorkspace: React.FC<ApprovalsWorkspaceProps> = ({
  initialItems = MOCK_APPROVAL_ITEMS,
}) => {
  const [items, setItems] = useState<ApprovalItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string>(initialItems[0]?.id || "appr-1042");

  const selectedApproval =
    items.find((it) => it.id === selectedId) || items[0] || initialItems[0];

  const handleApprove = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item
      )
    );
  };

  const handleReject = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Rejected" } : item
      )
    );
  };

  const handleRequestChanges = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Changes Requested" } : item
      )
    );
  };

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
        <ApprovalDetails
          approval={selectedApproval}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={handleRequestChanges}
        />
      </div>
    </div>
  );
};
