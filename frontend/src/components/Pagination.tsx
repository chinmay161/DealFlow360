import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between px-2 py-3 ${className || ""}`}>
      <div className="text-xs text-slate-500">
        {typeof totalItems === "number" ? (
          <>
            Showing <span className="font-semibold text-slate-800">{(page - 1) * (pageSize || 10) + 1}</span> to{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(page * (pageSize || 10), totalItems)}
            </span>{" "}
            of <span className="font-semibold text-slate-800">{totalItems}</span> results
          </>
        ) : (
          `Page ${page} of ${totalPages}`
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-2 text-xs"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <span className="text-xs font-semibold px-2 text-slate-600">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-2 text-xs"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
