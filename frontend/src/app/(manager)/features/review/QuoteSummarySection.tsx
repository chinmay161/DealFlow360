"use client";

import React from "react";
import { ApprovalBadge } from "../../components/ApprovalBadge";
import { RiskBadge } from "../../components/RiskBadge";
import { Building2, User, CreditCard, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { QuotationReviewDetails } from "../../types/manager.types";

interface QuoteSummarySectionProps {
  details: QuotationReviewDetails;
}

export const QuoteSummarySection: React.FC<QuoteSummarySectionProps> = ({ details }) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm space-y-4">
      {/* Top Header: Quote ID, Customer Name, Status, Risk */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            #{details.quotationNumber.split("-")[1] || "Q"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-on-surface">
                Quote #{details.quotationNumber}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                Tier: {details.customer.tier}
              </span>
            </div>
            <p className="text-xs text-outline">{details.customer.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RiskBadge score={details.riskScore} />
          <ApprovalBadge status={details.status} />
        </div>
      </div>

      {/* Grid of Key Info: Customer Credit, Sales Rep, Timestamps, Approval Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Customer Account */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Account Profile</span>
          </div>
          <p className="font-bold text-on-surface text-sm">{details.customer.name}</p>
          <div className="text-slate-500 text-[11px] space-y-0.5">
            <p>Payment: {details.customer.paymentTerms}</p>
            <p>Industry: {details.customer.industry || "Enterprise IT"}</p>
          </div>
        </div>

        {/* Sales Executive */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>Sales Representative</span>
          </div>
          <p className="font-bold text-on-surface text-sm">{details.owner.name}</p>
          <div className="text-slate-500 text-[11px] space-y-0.5">
            <p>{details.owner.email}</p>
            <p className="capitalize">Role: {details.owner.role.toLowerCase()}</p>
          </div>
        </div>

        {/* Credit Exposure */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
            <span>Credit Exposure</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-on-surface text-sm tnum">
              {formatCurrency(details.customer.creditAvailable, "INR")}
            </span>
            <span className="text-[10px] text-slate-400">avail</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Limit: {formatCurrency(details.customer.creditLimit, "INR")}
          </p>
        </div>

        {/* Submission & Approval Level */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>Approval Level</span>
          </div>
          <p className="font-bold text-primary text-sm">{details.currentStage}</p>
          <div className="text-slate-500 text-[11px]">
            <span>Submitted: </span>
            <span className="text-on-surface">
              {new Date(details.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
