"use client";

import React from "react";
import Link from "next/link";
import { Plus, Clock, FileEdit, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm dark:bg-slate-900/60 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">
          Quick Actions:
        </span>

        <Link href="/quotations?status=DRAFT">
          <Button variant="outline" size="sm" className="text-xs h-8">
            <FileEdit className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
            Drafts
          </Button>
        </Link>

        <Link href="/quotations?status=IN_REVIEW">
          <Button variant="outline" size="sm" className="text-xs h-8">
            <Clock className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
            View Pending
          </Button>
        </Link>

        <Link href="/customer/quotations">
          <Button variant="ghost" size="sm" className="text-xs h-8">
            Recent Quotations
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-slate-400" />
          </Button>
        </Link>
      </div>

      <Link href="/customer/quotations/new">
        <Button variant="primary" size="sm" className="text-xs h-8">
          <Plus className="h-4 w-4 mr-1.5" />
          New Quotation
        </Button>
      </Link>
    </div>
  );
}
