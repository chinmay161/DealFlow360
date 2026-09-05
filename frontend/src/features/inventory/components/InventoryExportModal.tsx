import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { exportInventoryToCSV, exportInventoryToExcel, printInventoryPDF } from "../services/export.service";
import type { InventoryItem } from "../types/inventory.types";

interface InventoryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
}

export const InventoryExportModal: React.FC<InventoryExportModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    setDownloading(type);
    try {
      if (type === "csv") {
        exportInventoryToCSV(items);
      } else if (type === "excel") {
        exportInventoryToExcel(items);
      } else if (type === "pdf") {
        printInventoryPDF();
      }
    } finally {
      setTimeout(() => {
        setDownloading(null);
        onClose();
      }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl border border-slate-200">
        <DialogHeader className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <Download className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            Export Enterprise Inventory Data
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Generate compliant read-only exports containing live availability, warehouse allocations, and valuation metrics for {items.length} records.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 pt-3">
          {/* CSV Export Option */}
          <div
            onClick={() => handleExport("csv")}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                  Comma-Separated Values (.CSV)
                </div>
                <div className="text-[11px] text-slate-400">
                  Universal raw data format for ERP &amp; warehouse pipelines
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-xs font-semibold text-blue-600">
              {downloading === "csv" ? "Generating..." : "Download"}
            </Button>
          </div>

          {/* Excel Export Option */}
          <div
            onClick={() => handleExport("excel")}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                  Microsoft Excel Spreadsheet (.XLS)
                </div>
                <div className="text-[11px] text-slate-400">
                  Formatted spreadsheet with headers and column styling
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-xs font-semibold text-emerald-600">
              {downloading === "excel" ? "Generating..." : "Download"}
            </Button>
          </div>

          {/* PDF Print Option */}
          <div
            onClick={() => handleExport("pdf")}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                  Print-Ready PDF Document (.PDF)
                </div>
                <div className="text-[11px] text-slate-400">
                  Clean executive layout for review and formal audits
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-xs font-semibold text-purple-600">
              {downloading === "pdf" ? "Printing..." : "Print / Save"}
            </Button>
          </div>
        </div>

        <div className="pt-2 text-right">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs border-slate-200">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
