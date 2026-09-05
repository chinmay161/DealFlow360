"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Eye,
  Edit,
  Copy,
  FileDown,
  ShieldCheck,
  Sparkles,
  History,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { SerializedQuotationListItem } from "@/lib/quotations";

interface QuickActionsMenuProps {
  quotation: SerializedQuotationListItem;
  onOpenDecisionTrace: (q: SerializedQuotationListItem) => void;
  onOpenRecommendations: (q: SerializedQuotationListItem) => void;
  onOpenAuditHistory: (q: SerializedQuotationListItem) => void;
  onQuotationDeleted?: (id: string) => void;
  onQuotationDuplicated?: (newQuotationId: string) => void;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  quotation,
  onOpenDecisionTrace,
  onOpenRecommendations,
  onOpenAuditHistory,
  onQuotationDeleted,
  onQuotationDuplicated,
}) => {
  const router = useRouter();
  const { success, error, toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDraft = quotation.status === "DRAFT";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsDuplicating(true);
    try {
      const res = await fetch(`/api/quotations/${encodeURIComponent(quotation.id)}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to duplicate quotation");
      const data = await res.json();
      success(`Duplicated successfully as ${data.quotationNumber || "new quotation"}!`);
      onQuotationDuplicated?.(data.id);
    } catch (err: any) {
      error("Duplication failed", err?.message);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!window.confirm(`Are you sure you want to delete quotation ${quotation.quotationNumber}?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quotations/${encodeURIComponent(quotation.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to delete quotation");
      }
      success(`Quotation ${quotation.quotationNumber} deleted.`);
      onQuotationDeleted?.(quotation.id);
    } catch (err: any) {
      error("Deletion failed", err?.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);

    // Generate a beautiful, printer-friendly view
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ type: "info", title: "Please allow popups to export quotation PDF." });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation Summary - ${quotation.quotationNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
            .subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #f1f5f9; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 30px 0; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            .card-title { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 8px; }
            .val { font-size: 16px; font-weight: bold; color: #0f172a; }
            .total-banner { background: #0284c7; color: white; padding: 20px; border-radius: 8px; text-align: right; margin-top: 30px; }
            .total-val { font-size: 28px; font-weight: bold; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Commercial Quotation</h1>
              <p class="subtitle">Reference: <strong>${quotation.quotationNumber}</strong> • DealFlow360 Enterprise</p>
            </div>
            <div>
              <span class="badge">STATUS: ${quotation.status}</span>
            </div>
          </div>
          <div class="grid">
            <div class="card">
              <div class="card-title">Customer Details</div>
              <div class="val">${quotation.customer.name}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                ${quotation.customer.industry || "Enterprise Account"} • ${quotation.customer.tier || "Standard"} Tier
              </div>
            </div>
            <div class="card">
              <div class="card-title">Commercial Representative</div>
              <div class="val">${quotation.owner.name || quotation.owner.email}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${quotation.owner.email}</div>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Deal Summary</div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span>Subtotal:</span>
              <strong>₹${(quotation.subtotal || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span>Total Concession:</span>
              <strong style="color: #b91c1c;">-₹${(quotation.discountTotal || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span>Applicable GST (18%):</span>
              <strong>₹${(quotation.taxTotal || 0).toLocaleString("en-IN")}</strong>
            </div>
          </div>
          <div class="total-banner">
            <div style="font-size: 13px; text-transform: uppercase;">Total Commercial Value</div>
            <div class="total-val">₹${(quotation.totalValue || 0).toLocaleString("en-IN")}</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        disabled={isDeleting || isDuplicating}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="w-7 h-7 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50"
        title="Quick Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs text-slate-700 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main navigation */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(`/quotations/${quotation.id}`);
              }}
              className="w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 hover:text-primary transition-colors font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>View Details</span>
            </button>

            {isDraft && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/quotations/${quotation.id}?edit=true`);
                }}
                className="w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 hover:text-primary transition-colors font-medium"
              >
                <Edit className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Quotation</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 hover:text-primary transition-colors font-medium"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Duplicate Quote</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 hover:text-primary transition-colors font-medium"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Export PDF / Print</span>
            </button>
          </div>

          {/* Governance & AI Engine */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenDecisionTrace(quotation);
              }}
              className="w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-blue-50 text-blue-900 transition-colors font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Decision Trace</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenRecommendations(quotation);
              }}
              className="w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-50 text-emerald-900 transition-colors font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>View Recommendations</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuditHistory(quotation);
              }}
              className="w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
            >
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>Audit History</span>
            </button>
          </div>

          {/* Destructive actions */}
          {isDraft && (
            <div className="py-1">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 text-rose-700 transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Draft</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
