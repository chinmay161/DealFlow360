"use client";

import React, { useState } from "react";
import { SerializedCustomer, SerializedOwner } from "@/lib/quotations";
import { getCustomersAction } from "@/lib/actions/lookupActions";
import { switchCustomerAction } from "@/lib/actions/quoteActions";
import { formatCurrency } from "@/lib/currency";

interface CustomerSummaryProps {
  quotationId?: string;
  customer?: SerializedCustomer;
  owner?: SerializedOwner;
  buyerContact?: { name: string; title: string; email: string } | null;
  paymentTerms?: string | null;
  creditLine?: string | null;
  territory?: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
  externalAccountId: string | null;
  industry: string | null;
  tier: string;
  paymentTerms: string | null;
  creditLimit: number;
  creditAvailable: number;
  territory: string | null;
  primaryContact: { name: string; title: string | null; email: string } | null;
}

export const CustomerSummary: React.FC<CustomerSummaryProps> = ({
  quotationId,
  customer,
  owner,
  buyerContact = null,
  paymentTerms = null,
  creditLine = null,
  territory = null,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Derive customer initials dynamically (e.g. "Apex Infotech" -> "AI")
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
  const ownerEmail = owner?.email || "representative@dealflow360.in";

  const openCustomerPicker = async () => {
    setIsModalOpen(true);
    if (customers.length === 0) {
      setIsLoading(true);
      try {
        const list = await getCustomersAction();
        setCustomers(list);
      } catch (err) {
        console.error("Failed to load customers:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectCustomer = async (selectedCustomer: CustomerOption) => {
    if (!quotationId || selectedCustomer.id === customer?.id) {
      setIsModalOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await switchCustomerAction({
        quotationId,
        customerId: selectedCustomer.id,
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to switch customer:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.externalAccountId && c.externalAccountId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-space-base shadow-[0px_1px_2px_rgba(15,23,42,0.04)] grid grid-cols-4 gap-space-lg">
        {/* 1. Account & Customer */}
        <div
          onClick={quotationId ? openCustomerPicker : undefined}
          className={`group rounded-md p-1 -m-1 transition-colors ${
            quotationId ? "cursor-pointer hover:bg-[#F8FAFC]" : ""
          }`}
          title={quotationId ? "Click to switch customer account" : undefined}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              Account &amp; Customer
            </span>
            {quotationId && (
              <span className="material-symbols-outlined text-xs text-outline group-hover:text-primary transition-colors" data-icon="swap_horiz">
                swap_horiz
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <span className="font-title-md text-title-md font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
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

      {/* Customer Switcher Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" data-icon="corporate_fare">
                  corporate_fare
                </span>
                <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                  Select Customer Account
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-base" data-icon="close">
                  close
                </span>
              </button>
            </div>

            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" data-icon="search">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search customer by name, account ID, or industry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#D1D5DB] rounded-md text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 divide-y divide-[#F1F5F9]">
              {isLoading ? (
                <div className="py-8 text-center text-outline text-body-sm">
                  Loading customers from PostgreSQL...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-outline text-body-sm">
                  No customers found matching &quot;{searchTerm}&quot;
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isCurrent = c.id === customer?.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => !isSwitching && handleSelectCustomer(c)}
                      className={`p-3 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent
                          ? "bg-[#EFF6FF] border border-[#BFDBFE]"
                          : "hover:bg-[#F8FAFC]"
                      } ${isSwitching ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-title-md text-body-md font-semibold text-on-surface">
                            {c.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            c.tier === "GOLD"
                              ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                              : c.tier === "PLATINUM"
                              ? "bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]"
                              : "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                          }`}>
                            {c.tier} TIER
                          </span>
                        </div>
                        <div className="font-body-sm text-[11px] text-outline mt-0.5">
                          ID: {c.externalAccountId || "N/A"} • {c.industry || "General Commercial"} • Terms: {c.paymentTerms || "Net 30"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-body-sm text-xs font-semibold text-on-surface">
                          Credit: {formatCurrency(c.creditAvailable, "INR")}
                        </div>
                        <div className="font-body-sm text-[11px] text-outline">
                          {c.territory || "West India"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-[#F8F9FA] border-t border-[#E5E7EB] flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 px-4 rounded-md border border-[#D1D5DB] bg-white text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
