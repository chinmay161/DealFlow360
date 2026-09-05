"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createQuotationWithDetailsAction } from "@/lib/actions/quoteActions";

interface ContactSummary {
  id: string;
  name: string;
  email: string;
  title: string | null;
}

export interface CustomerOption {
  id: string;
  customerNumber: string | null;
  name: string;
  externalAccountId: string | null;
  industry: string | null;
  tier: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  paymentTerms: string | null;
  contacts: ContactSummary[];
}

interface CreateQuotationFormProps {
  customers: CustomerOption[];
  initialCustomerId?: string;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PLATINUM: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  GOLD: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  SILVER: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  BRONZE: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  STANDARD: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
};

export const CreateQuotationForm: React.FC<CreateQuotationFormProps> = ({
  customers,
  initialCustomerId,
}) => {
  const router = useRouter();

  const defaultId =
    (initialCustomerId && customers.some((c) => c.id === initialCustomerId))
      ? initialCustomerId
      : customers[0]?.id || "";

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(defaultId);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [paymentTerms, setPaymentTerms] = useState<string>(
    customers.find((c) => c.id === defaultId)?.paymentTerms || "Net 30 Days"
  );
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compact selector state
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const availableContacts = currentCustomer?.contacts || [];

  // If initialCustomerId changed or was passed, auto-select
  useEffect(() => {
    if (initialCustomerId && customers.some((c) => c.id === initialCustomerId)) {
      handleCustomerChange(initialCustomerId);
    }
  }, [initialCustomerId, customers]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCustomerChange = (newCustomerId: string) => {
    setSelectedCustomerId(newCustomerId);
    setIsSelectorOpen(false);
    setSearchTerm("");
    const matched = customers.find((c) => c.id === newCustomerId);
    if (matched) {
      if (matched.paymentTerms) {
        setPaymentTerms(matched.paymentTerms);
      }
      if (matched.contacts.length > 0) {
        setSelectedContactId(matched.contacts[0].id);
      } else {
        setSelectedContactId("");
      }
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.customerNumber && c.customerNumber.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.state && c.state.toLowerCase().includes(q)) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMsg("Please select a customer.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createQuotationWithDetailsAction({
        customerId: selectedCustomerId,
        contactId: selectedContactId || null,
        currency,
        paymentTerms,
        notes: notes.trim() || null,
      });

      if (res.success && res.id) {
        router.push(`/quotations/${res.id}`);
      } else {
        setErrorMsg("Failed to create quotation. Please check your inputs.");
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      console.error("Error creating quotation:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to create quotation."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-space-base pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
        <Link href="/quotations" className="hover:text-primary transition-colors">
          Quotations
        </Link>
        <span className="material-symbols-outlined text-xs" data-icon="chevron_right">
          chevron_right
        </span>
        <span className="text-primary font-semibold">New Quotation</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
          Create New Quotation
        </h1>
        <p className="font-body-sm text-body-sm text-outline mt-0.5">
          Select an enterprise account, configure commercial parameters, and launch the quotation workspace.
        </p>
      </div>

      {/* Banner when redirected from /customers/new */}
      {initialCustomerId && currentCustomer?.id === initialCustomerId && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base" data-icon="check_circle">
              check_circle
            </span>
            <span>
              Customer <strong>{currentCustomer.customerNumber || currentCustomer.name}</strong> created successfully and selected for this quotation.
            </span>
          </div>
          <span className="text-[11px] font-medium text-emerald-600">Active</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base" data-icon="error">
            error
          </span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-visible"
      >
        <div className="p-6 space-y-6">
          {/* Compact Customer Selector */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-on-surface">
                Customer Account <span className="text-error">*</span>
              </label>
              <Link
                href="/customers/new"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
                id="add-new-customer-link"
              >
                <span className="material-symbols-outlined text-sm" data-icon="add_circle">
                  add_circle
                </span>
                <span>+ Add New Customer</span>
              </Link>
            </div>

            {/* Selected Card / Trigger Button */}
            <div
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 border border-[#D1D5DB] rounded-lg cursor-pointer transition-all flex items-center justify-between"
            >
              {currentCustomer ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                    {currentCustomer.customerNumber?.replace("CUST-", "") || "01"}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-on-surface">
                        {currentCustomer.name}
                      </span>
                      {currentCustomer.customerNumber && (
                        <span className="px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          {currentCustomer.customerNumber}
                        </span>
                      )}
                      {currentCustomer.tier && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            TIER_COLORS[currentCustomer.tier]?.bg || "bg-gray-100"
                          } ${TIER_COLORS[currentCustomer.tier]?.text || "text-gray-700"} ${
                            TIER_COLORS[currentCustomer.tier]?.border || "border-gray-200"
                          }`}
                        >
                          {currentCustomer.tier}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-outline mt-0.5 flex items-center gap-2">
                      {currentCustomer.city && currentCustomer.state && (
                        <span>
                          {currentCustomer.city}, {currentCustomer.state}
                        </span>
                      )}
                      {currentCustomer.industry && (
                        <>
                          <span>•</span>
                          <span>{currentCustomer.industry}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-outline">Select customer account...</span>
              )}
              <div className="flex items-center gap-1.5 text-outline">
                <span className="text-xs font-medium">Change</span>
                <span
                  className={`material-symbols-outlined text-lg transition-transform ${
                    isSelectorOpen ? "rotate-180" : ""
                  }`}
                  data-icon="expand_more"
                >
                  expand_more
                </span>
              </div>
            </div>

            {/* Dropdown Menu */}
            {isSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {/* Search Bar */}
                <div className="p-2.5 border-b border-[#F3F4F6] bg-slate-50/70">
                  <div className="relative">
                    <span
                      className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base"
                      data-icon="search"
                    >
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search company name, CUST-XXXXX, city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                      className="w-full h-9 pl-9 pr-8 text-xs bg-white border border-[#D1D5DB] rounded-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2.5 top-2 text-outline hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-sm" data-icon="close">
                          close
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Account List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-[#F3F4F6]">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-outline space-y-2">
                      <p>No customers match &ldquo;{searchTerm}&rdquo;</p>
                      <Link
                        href="/customers/new"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded hover:bg-primary/90"
                      >
                        + Create &ldquo;{searchTerm}&rdquo;
                      </Link>
                    </div>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isSelected = cust.id === selectedCustomerId;
                      const tierStyle =
                        TIER_COLORS[cust.tier || ""] || {
                          bg: "bg-gray-50",
                          text: "text-gray-700",
                          border: "border-gray-200",
                        };

                      return (
                        <div
                          key={cust.id}
                          onClick={() => handleCustomerChange(cust.id)}
                          className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-50/60 hover:bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0">
                              {cust.customerNumber?.replace("CUST-", "") || "•"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-on-surface">
                                  {cust.name}
                                </span>
                                {cust.customerNumber && (
                                  <span className="px-1 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                    {cust.customerNumber}
                                  </span>
                                )}
                                {cust.tier && (
                                  <span
                                    className={`px-1 py-0.2 rounded text-[9px] font-bold border uppercase ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                                  >
                                    {cust.tier}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-outline mt-0.5 flex items-center gap-1.5">
                                {cust.city && cust.state && (
                                  <span>
                                    {cust.city}, {cust.state}
                                  </span>
                                )}
                                {cust.industry && (
                                  <>
                                    <span>•</span>
                                    <span>{cust.industry}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <span
                              className="material-symbols-outlined text-primary text-base"
                              data-icon="check"
                            >
                              check
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sticky Action Footer */}
                <div className="p-2.5 border-t border-[#E5E7EB] bg-slate-50 flex items-center justify-between">
                  <span className="text-[11px] text-outline">
                    Showing {filteredCustomers.length} of {customers.length} enterprise accounts
                  </span>
                  <Link
                    href="/customers/new"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    <span className="material-symbols-outlined text-sm" data-icon="add_circle">
                      add_circle
                    </span>
                    <span>+ Add New Customer</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Contact / Buyer Selection & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Buyer Contact (Optional)
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">None / Unassigned</option>
                {availableContacts.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name} {ct.title ? `(${ct.title})` : ""} - {ct.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Currency <span className="text-error">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="INR">INR (₹) — Indian Rupee (Default)</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
              </select>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Payment Terms <span className="text-error">*</span>
            </label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="Net 15 Days">Net 15 Days</option>
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 45 Days">Net 45 Days</option>
              <option value="Net 60 Days">Net 60 Days</option>
              <option value="Immediate / Due on Receipt">Immediate / Due on Receipt</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Commercial Proposal Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter special discount justifications, delivery timelines, or milestone remarks..."
              rows={3}
              maxLength={500}
              className="w-full p-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between">
          <Link
            href="/quotations"
            className="px-4 py-2 text-xs font-semibold text-on-surface hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin" data-icon="progress_activity">
                  progress_activity
                </span>
                <span>Creating Quotation...</span>
              </>
            ) : (
              <>
                <span>Create &amp; Open Workspace</span>
                <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
