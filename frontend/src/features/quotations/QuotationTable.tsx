"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DataTable, ColumnDef } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { ApprovalBadge } from "@/components/ApprovalBadge";
import { Button } from "@/components/ui/button";
import { Eye, Edit3, Copy, Download } from "lucide-react";
import type { Quotation } from "@/types/quotation.types";
import { quotationService } from "@/services/quotation.service";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "next/navigation";

interface QuotationTableProps {
  quotations: Quotation[];
  isLoading?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRefresh?: () => void;
}

export function QuotationTable({
  quotations,
  isLoading = false,
  sortBy,
  sortOrder,
  onSort,
  onRefresh,
}: QuotationTableProps) {
  const toast = useToast();
  const router = useRouter();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleDuplicate = async (id: string, quoteNumber: string) => {
    try {
      setActionLoadingId(id);
      const res = await quotationService.duplicateQuotation(id);
      toast.success("Quotation duplicated", `Created copy ${res.quotationNumber} from #${quoteNumber}`);
      if (onRefresh) onRefresh();
      router.push(`/quotations/${res.quotationNumber}`);
    } catch {
      toast.error("Duplicate failed", "Unable to duplicate quotation");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExport = (quotation: Quotation) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quotation, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Quotation-${quotation.quotationNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Quotation exported", `Downloaded JSON file for #${quotation.quotationNumber}`);
  };

  const columns: ColumnDef<Quotation>[] = [
    {
      key: "quoteNumber",
      header: "Quote Number",
      sortable: true,
      render: (q) => (
        <Link
          href={`/customer/quotations/${q.quotationNumber}`}
          className="font-mono font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
        >
          <span>#{q.quotationNumber}</span>
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (q) => (
        <div>
          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {q.customer.name}
          </div>
          <div className="text-[11px] text-slate-400">
            {q.customer.tier} Tier • {q.customer.industry || "Commercial"}
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (q) => (
        <div className="text-xs text-slate-500 font-mono">
          {new Date(q.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (q) => <StatusBadge status={q.status} />,
    },
    {
      key: "riskScore",
      header: "Risk Score",
      sortable: true,
      render: (q) => <RiskBadge score={q.riskScore} />,
    },
    {
      key: "approvalLevel",
      header: "Approval Level",
      render: (q) => <ApprovalBadge level={q.currentStage} status={q.status} />,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (q) => (
        <div className="font-semibold font-mono text-xs text-slate-900 dark:text-slate-100">
          ₹{Number(q.totalValue).toLocaleString()}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (q) => {
        const isDraft = q.status === "DRAFT";
        const isDuplicating = actionLoadingId === q.id;

        return (
          <div className="flex items-center justify-end gap-1">
            {/* View action */}
            <Link href={`/customer/quotations/${q.quotationNumber}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                title="View Quotation"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>

            {/* Edit Draft action */}
            {isDraft && (
              <Link href={`/customer/quotations/${q.quotationNumber}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-500 hover:text-amber-600"
                  title="Edit Draft"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}

            {/* Duplicate action */}
            <Button
              variant="ghost"
              size="sm"
              disabled={isDuplicating}
              onClick={() => handleDuplicate(q.id, q.quotationNumber)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
              title="Duplicate Quotation"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>

            {/* Export JSON action */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport(q)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
              title="Export Quotation"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={quotations}
      isLoading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyTitle="No quotations found"
      emptyDescription="No deals matched your search and filter criteria. Try adjusting your search query or reset filters."
    />
  );
}
