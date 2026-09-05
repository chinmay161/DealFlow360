"use client";

import React from "react";
import Link from "next/link";
import { RiskBadge } from "./RiskBadge";
import { ApprovalBadge } from "./ApprovalBadge";
import { ChevronRight, User } from "lucide-react";
import type { ApprovalItem } from "../types/manager.types";

interface ApprovalCardProps {
  item: ApprovalItem;
  onQuickApprove?: (id: string) => void;
  onQuickReject?: (id: string) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  item,
}) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-sm hover:border-primary/40 transition-all group flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top bar: Quote Number & Risk Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/manager/quotation/${item.quotationNumber}`}
              className="text-xs font-bold text-primary hover:underline"
            >
              #{item.quotationNumber}
            </Link>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
              {item.customerTier}
            </span>
          </div>
          <RiskBadge score={item.riskScore} category={item.riskCategory} size="sm" />
        </div>

        {/* Customer & Amount */}
        <div>
          <h4 className="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
            {item.customer}
          </h4>
          <p className="text-base font-bold text-on-surface tnum mt-0.5">
            {item.formattedAmount}
          </p>
        </div>

        {/* Sales Rep info */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9] text-xs text-outline">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px]">
            <User className="h-3 w-3" />
          </div>
          <span className="truncate">{item.salesExecutive.name}</span>
          <span className="ml-auto text-[11px] text-slate-400">{item.submittedTimeAgo}</span>
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
        <ApprovalBadge status={item.status} size="sm" />
        <Link
          href={`/manager/quotation/${item.quotationNumber}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-[#1E3A8A] transition-colors"
        >
          <span>Review</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
