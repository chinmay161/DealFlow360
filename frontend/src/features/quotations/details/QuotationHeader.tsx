"use client";

import React, { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { ApprovalBadge } from "@/components/ApprovalBadge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Quotation } from "@/types/quotation.types";
import { quotationService } from "@/services/quotation.service";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "next/navigation";

interface QuotationHeaderProps {
  quotation: Quotation;
  onRefresh: () => void;
}

export function QuotationHeader({ quotation, onRefresh }: QuotationHeaderProps) {
  const toast = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const isDraft = quotation.status === "DRAFT";

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete draft #${quotation.quotationNumber}?`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await quotationService.deleteQuotation(quotation.id);
      toast.success("Quotation deleted", `Removed draft #${quotation.quotationNumber}`);
      router.push("/customer/quotations");
    } catch {
      toast.error("Delete failed", "Unable to delete draft quotation");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm dark:bg-slate-900/60 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-50">
              #{quotation.quotationNumber}
            </h1>
            <StatusBadge status={quotation.status} />
            <RiskBadge score={quotation.riskScore} />
            <ApprovalBadge level={quotation.currentStage} status={quotation.status} />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            <span>Customer: <strong className="text-slate-800 dark:text-slate-200">{quotation.customer.name}</strong></span>
            <span>•</span>
            <span>Created: {new Date(quotation.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>Owner: {quotation.owner?.name || "Commercial Representative"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {isDraft && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs h-9 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
