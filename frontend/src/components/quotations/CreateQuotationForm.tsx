"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createQuotationWithDetailsAction } from "@/lib/actions/quoteActions";
import {
  getCustomerByIdAction,
  CompleteCustomerProfile,
  CustomerSelectorItem,
} from "@/lib/actions/customerActions";

export type CustomerOption = CustomerSelectorItem;

interface CreateQuotationFormProps {
  customers: CustomerSelectorItem[];
  initialCustomer?: CompleteCustomerProfile | null;
  initialCustomerId?: string;
  isCustomerRole?: boolean;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PLATINUM: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  GOLD: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  SILVER: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  BRONZE: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  STANDARD: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
};

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const CreateQuotationForm: React.FC<CreateQuotationFormProps> = ({
  customers,
  initialCustomer = null,
  initialCustomerId,
  isCustomerRole = false,
}) => {
  const router = useRouter();

  // The ONE selected customer profile (complete data from PostgreSQL)
  const [selectedCustomer, setSelectedCustomer] = useState<CompleteCustomerProfile | null>(
    initialCustomer || null
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomer?.id || initialCustomerId || ""
  );
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  // Commercial parameters
  const [selectedContactId, setSelectedContactId] = useState<string>(
    initialCustomer?.primaryContact?.id || initialCustomer?.contacts?.[0]?.id || ""
  );
  const [currency, setCurrency] = useState<string>("INR");
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialCustomer?.paymentTerms || "Net 30 Days"
  );
  const [notes, setNotes] = useState<string>("");

  // Modal selector state (only open when Sales Rep explicitly clicks Change / Select)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initialCustomer if it arrives or changes
  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      setSelectedCustomerId(initialCustomer.id);
      if (initialCustomer.paymentTerms) {
        setPaymentTerms(initialCustomer.paymentTerms);
      }
      if (initialCustomer.contacts && initialCustomer.contacts.length > 0) {
        const primary = initialCustomer.contacts.find((c) => c.isPrimary) || initialCustomer.contacts[0];
        setSelectedContactId(primary.id);
      } else {
        setSelectedContactId("");
      }
    } else if (initialCustomerId && !selectedCustomer) {
      // If customer ID was passed via query param but not preloaded, fetch it now
      handleSelectCustomer(initialCustomerId);
    }
  }, [initialCustomer, initialCustomerId]);

  const handleSelectCustomer = async (newCustomerId: string) => {
    setIsModalOpen(false);
    setSearchTerm("");

    if (!newCustomerId) return;
    if (newCustomerId === selectedCustomerId && selectedCustomer) return;

    setIsLoadingCustomer(true);
    setErrorMsg(null);

    try {
      const profile = await getCustomerByIdAction(newCustomerId);
      if (profile) {
        // Tie quotation exclusively to this ONE customer account
        setSelectedCustomer(profile);
        setSelectedCustomerId(profile.id);

        // Re-resolve commercial settings from authoritative PostgreSQL record
        setPaymentTerms(profile.paymentTerms || "Net 30 Days");

        // Clear previous customer's contacts and select primary contact
        if (profile.contacts && profile.contacts.length > 0) {
          const primary = profile.contacts.find((c) => c.isPrimary) || profile.contacts[0];
          setSelectedContactId(primary.id);
        } else {
          setSelectedContactId("");
        }
      } else {
        setErrorMsg("Failed to load customer profile from PostgreSQL.");
      }
    } catch (err) {
      console.error("[CreateQuotationForm] Error loading customer profile:", err);
      setErrorMsg("Error retrieving customer profile from database.");
    } finally {
      setIsLoadingCustomer(false);
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

  const availableContacts = selectedCustomer?.contacts || [];
  const primaryBuyer =
    availableContacts.find((c) => c.id === selectedContactId) ||
    selectedCustomer?.primaryContact ||
    availableContacts[0] ||
    null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMsg("Please select a customer account.");
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
        router.push(isCustomerRole ? `/portal/quotations/${res.id}` : `/quotations/${res.id}`);
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

  const customerInitials = selectedCustomer?.name
    ? selectedCustomer.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : "CA";

  return (
    <div className="max-w-3xl mx-auto space-y-space-base pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
        <Link
          href={isCustomerRole ? "/portal/quotations" : "/quotations"}
          className="hover:text-primary transition-colors"
        >
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
      {initialCustomerId && selectedCustomer?.id === initialCustomerId && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base" data-icon="check_circle">
              check_circle
            </span>
            <span>
              Customer <strong>{selectedCustomer.customerNumber || selectedCustomer.name}</strong> created successfully and selected for this quotation.
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
          {/* Section: Customer Account Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-on-surface">
                Customer Account <span className="text-error">*</span>
              </label>
              {!isCustomerRole && (
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
              )}
            </div>

            {/* If Customer is selected: Show compact account card with full saved profile */}
            {selectedCustomer ? (
              <div className="w-full bg-slate-50 border border-[#D1D5DB] rounded-lg p-4 transition-all">
                {/* Top Summary Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0 mt-0.5">
                      {selectedCustomer.customerNumber?.replace("CUST-", "") || customerInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-on-surface">
                          {selectedCustomer.name}
                        </span>
                        {selectedCustomer.tier && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              TIER_COLORS[selectedCustomer.tier]?.bg || "bg-gray-100"
                            } ${TIER_COLORS[selectedCustomer.tier]?.text || "text-gray-700"} ${
                              TIER_COLORS[selectedCustomer.tier]?.border || "border-gray-200"
                            }`}
                          >
                            {selectedCustomer.tier}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-outline mt-0.5 flex items-center gap-2 flex-wrap">
                        {selectedCustomer.customerNumber && (
                          <span className="font-mono font-medium text-on-surface-variant">
                            {selectedCustomer.customerNumber}
                          </span>
                        )}
                        {(selectedCustomer.city || selectedCustomer.state) && (
                          <>
                            <span>•</span>
                            <span>
                              {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.country]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </>
                        )}
                      </div>
                      {selectedCustomer.industry && (
                        <div className="text-xs text-outline mt-0.5">
                          {selectedCustomer.industry}
                          {selectedCustomer.otherIndustryDetails && ` • ${selectedCustomer.otherIndustryDetails}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Explicit Change Action Button - Only rendered for internal sales staff */}
                  {!isCustomerRole && (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 rounded border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                      id="change-customer-btn"
                    >
                      <span>Change</span>
                      <span className="material-symbols-outlined text-sm" data-icon="swap_horiz">
                        swap_horiz
                      </span>
                    </button>
                  )}
                </div>

                {/* Authoritative PostgreSQL Customer Profile Attributes */}
                <div className="border-t border-[#E5E7EB] mt-3.5 pt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] font-medium text-outline block">Terms</span>
                    <span className="font-semibold text-on-surface">
                      {selectedCustomer.paymentTerms || "Net 30 Days"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-outline block">Available Credit</span>
                    <span className="font-semibold text-on-surface">
                      {formatIndianCurrency(selectedCustomer.creditAvailable)}
                    </span>
                  </div>
                  {selectedCustomer.territory && (
                    <div>
                      <span className="text-[11px] font-medium text-outline block">Territory</span>
                      <span className="font-semibold text-on-surface">
                        {selectedCustomer.territory}
                      </span>
                    </div>
                  )}
                  {selectedCustomer.priceList && (
                    <div>
                      <span className="text-[11px] font-medium text-outline block">Price List</span>
                      <span className="font-semibold text-on-surface">
                        {selectedCustomer.priceList.name} ({selectedCustomer.priceList.code})
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] font-medium text-outline block">Primary Buyer</span>
                    <span className="font-semibold text-on-surface">
                      {primaryBuyer?.name || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-outline block">Business Email</span>
                    <span
                      className="font-medium text-on-surface truncate block"
                      title={primaryBuyer?.email || ""}
                    >
                      {primaryBuyer?.email || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-outline block">Mobile</span>
                    <span className="font-medium text-on-surface">
                      {primaryBuyer?.phone || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-outline block">Portal Access</span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        primaryBuyer?.portalAccessEnabled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {primaryBuyer?.portalAccessEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            ) : isCustomerRole ? (
              <div className="w-full p-4 bg-slate-50 border border-[#D1D5DB] rounded-lg text-xs text-outline">
                Loading authenticated customer account details from database...
              </div>
            ) : (
              /* If No Customer is selected: Prompt to select account (internal staff only) */
              <div
                onClick={() => setIsModalOpen(true)}
                className="w-full p-4 bg-slate-50/60 hover:bg-slate-50 border border-dashed border-[#D1D5DB] hover:border-primary/50 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                id="select-customer-prompt"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-primary/10 border border-slate-200 group-hover:border-primary/20 flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg" data-icon="corporate_fare">
                      corporate_fare
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Select Customer Account
                    </span>
                    <span className="text-[11px] text-outline block mt-0.5">
                      Choose an enterprise account from PostgreSQL to bind commercial parameters and price rules.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-md border border-primary/20 transition-colors flex items-center gap-1"
                >
                  <span>Select Account</span>
                  <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">
                    arrow_forward
                  </span>
                </button>
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
                disabled={!selectedCustomer || availableContacts.length === 0}
                className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-slate-50 disabled:text-outline"
              >
                {!selectedCustomer ? (
                  <option value="">Select a customer account first</option>
                ) : availableContacts.length === 0 ? (
                  <option value="">No contacts registered for this account</option>
                ) : (
                  <>
                    <option value="">None / Unassigned</option>
                    {availableContacts.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name} {ct.title ? `(${ct.title})` : ""} - {ct.email}
                      </option>
                    ))}
                  </>
                )}
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
            {selectedCustomer?.paymentTerms && (
              <p className="text-[11px] text-outline mt-1">
                Authoritative customer terms from database: <strong>{selectedCustomer.paymentTerms}</strong>
              </p>
            )}
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
            href={isCustomerRole ? "/portal/quotations" : "/quotations"}
            className="px-4 py-2 text-xs font-semibold text-on-surface hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingCustomer || !selectedCustomerId}
            className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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

      {/* Compact Selector Modal (Only opens for internal sales staff) */}
      {!isCustomerRole && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" data-icon="swap_horiz">
                  swap_horiz
                </span>
                <div>
                  <h3 className="font-semibold text-sm text-on-surface">
                    Select Customer Account
                  </h3>
                  <p className="text-[11px] text-outline">
                    Choose the target enterprise customer for this quotation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchTerm("");
                }}
                className="p-1 text-outline hover:text-on-surface rounded-md hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-lg" data-icon="close">
                  close
                </span>
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-[#F3F4F6] bg-white">
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base"
                  data-icon="search"
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search company name, CUST-XXXXX, city, industry..."
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

            {/* Modal Account List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6]">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-xs text-outline space-y-3">
                  <p>No customers match &ldquo;{searchTerm}&rdquo;</p>
                  <Link
                    href="/customers/new"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded hover:bg-primary/90"
                  >
                    + Register New Customer
                  </Link>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = cust.id === selectedCustomerId;
                  const tierStyle =
                    TIER_COLORS[cust.tier] || {
                      bg: "bg-gray-50",
                      text: "text-gray-700",
                      border: "border-gray-200",
                    };

                  return (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust.id)}
                      className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50/60 hover:bg-blue-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
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
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
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

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#E5E7EB] bg-slate-50 flex items-center justify-between">
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
        </div>
      )}
    </div>
  );
};
