"use client";

import React from "react";
import { SerializedCustomer, SerializedOwner } from "@/lib/quotations";

interface CustomerSummaryProps {
  customer?: SerializedCustomer;
  owner?: SerializedOwner;
  buyerContact?: { name: string; title: string; email: string } | null;
  paymentTerms?: string | null;
  creditLine?: string | null;
  territory?: string | null;
}

export const CustomerSummary: React.FC<CustomerSummaryProps> = ({
  customer,
  owner,
  buyerContact = null,
  paymentTerms = null,
  creditLine = null,
  territory = null,
}) => {
  // Derive customer initials dynamically (e.g. "Acme Corporation" -> "AC")
  const customerName = customer?.name || "Customer Account";
  const initials =
    customerName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CA";

  const accountId = customer?.externalAccountId || "N/A";
  const industryText = customer?.industry || "Commercial Account";

  const ownerName = owner?.name || (owner?.email ? owner.email.split("@")[0] : "Assigned Representative");
  const ownerEmail = owner?.email || "representative@dealflow360.io";

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] grid grid-cols-4 gap-space-lg">
      {/* 1. Account & Customer */}
      <div>
        <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">
          Account &amp; Customer
        </span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <span className="font-title-md text-title-md font-semibold text-on-surface truncate">
            {customerName}
          </span>
        </div>
        <span className="font-body-sm text-[11px] text-outline mt-0.5 block truncate">
          {industryText} • ID: {accountId}
        </span>
      </div>

      {/* 2. Primary Buyer Contact */}
      <div>
        <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">
          Primary Buyer Contact
        </span>
        <span className="font-title-md text-body-md font-medium text-on-surface block truncate">
          {buyerContact ? buyerContact.name : "Procurement Authority"}
        </span>
        <span className="font-body-sm text-[11px] text-outline block truncate">
          {buyerContact
            ? `${buyerContact.title} (${buyerContact.email})`
            : "Direct Commercial Contact"}
        </span>
      </div>

      {/* 3. Payment & Terms */}
      <div>
        <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">
          Payment &amp; Terms
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-title-md text-body-md font-semibold text-on-surface">
            {paymentTerms || "Net 45 Days"}
          </span>
          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1E40AF]">
            Standard
          </span>
        </div>
        <span className="font-body-sm text-[11px] text-outline block truncate">
          {creditLine || "Credit Line: Standard Active Limit"}
        </span>
      </div>

      {/* 4. Sales Representative */}
      <div>
        <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">
          Sales Representative
        </span>
        <span className="font-title-md text-body-md font-medium text-on-surface block truncate">
          {ownerName}
        </span>
        <span className="font-body-sm text-[11px] text-outline block truncate">
          {territory || `Account Owner • ${ownerEmail}`}
        </span>
      </div>
    </div>
  );
};
