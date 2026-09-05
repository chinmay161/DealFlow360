"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCustomerAction } from "@/lib/actions/customerActions";

interface CreateCustomerFormProps {
  initialCustomerNumber: string;
}

const COMMON_INDUSTRIES = [
  "Enterprise Cloud & Infrastructure",
  "Financial Technology & Trading",
  "Industrial Automation & Robotics",
  "Precision Engineering & Heavy Mfg",
  "Telecommunications & SatCom",
  "Logistics & Supply Chain",
  "Healthcare & Life Sciences",
  "Consumer & Retail Tech",
  "Government & Defence Technologies",
];

const COMMON_TIERS = [
  { value: "BRONZE", label: "Bronze Account", desc: "Default starting tier, standard commercial terms" },
  { value: "SILVER", label: "Silver Tier", desc: "Established volume buyer, up to 12% discount" },
  { value: "GOLD", label: "Gold Tier", desc: "Strategic account, up to 15% discount approval" },
  { value: "PLATINUM", label: "Platinum Enterprise", desc: "Top-tier account, executive governance terms" },
];

export const CreateCustomerForm: React.FC<CreateCustomerFormProps> = ({
  initialCustomerNumber,
}) => {
  const router = useRouter();

  // Form states
  const [customerNumber] = useState(initialCustomerNumber);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Enterprise Cloud & Infrastructure");
  const [tier, setTier] = useState<"BRONZE" | "SILVER" | "GOLD" | "PLATINUM">("BRONZE");
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");
  const [creditLimit, setCreditLimit] = useState("1000000");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [country] = useState("India");

  // Primary Contact
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("+91 ");
  const [contactTitle, setContactTitle] = useState("Head of Procurement");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createCustomerAction({
        customerNumber,
        name: name.trim(),
        industry: industry.trim(),
        tier,
        paymentTerms,
        creditLimit: Number(creditLimit) || 1000000,
        city: city.trim(),
        state: state.trim(),
        country,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim() || null,
        contactTitle: contactTitle.trim() || null,
      });

      if (res.success && res.customer) {
        // Redirect directly to /quotations/new with customer pre-selected
        router.push(`/quotations/new?customerId=${res.customer.id}`);
      } else {
        setErrorMsg(res.error || "Failed to create customer account.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error creating customer:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to create customer account.");
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
        <Link href="/quotations/new" className="hover:text-primary transition-colors">
          New Quotation
        </Link>
        <span className="material-symbols-outlined text-xs" data-icon="chevron_right">
          chevron_right
        </span>
        <span className="text-primary font-semibold">New Customer</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
          Add New Enterprise Customer
        </h1>
        <p className="font-body-sm text-body-sm text-outline mt-0.5">
          Register an enterprise buyer organization with permanent Customer ID and primary procurement contact.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base" data-icon="error">
            error
          </span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden"
      >
        <div className="p-6 space-y-6">
          {/* Section 1: Customer Identity */}
          <div className="border-b border-[#F3F4F6] pb-5">
            <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary" data-icon="badge">
                badge
              </span>
              <span>Account Identity &amp; System Identifier</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Permanent Customer ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerNumber}
                    readOnly
                    className="w-full h-10 px-3 rounded-md bg-slate-100 border border-[#D1D5DB] text-on-surface text-xs font-mono font-bold cursor-not-allowed text-primary"
                  />
                  <span className="absolute right-2.5 top-2.5 px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded">
                    Generated
                  </span>
                </div>
                <p className="text-[11px] text-outline mt-1">
                  Unique, immutable business identifier.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Company Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tata Advanced Systems Ltd."
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Commercial Profile & Location */}
          <div className="border-b border-[#F3F4F6] pb-5">
            <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary" data-icon="domain">
                domain
              </span>
              <span>Commercial Profile &amp; Location</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Industry Sector <span className="text-error">*</span>
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {COMMON_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Customer Tier <span className="text-error">*</span>
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as "BRONZE" | "SILVER" | "GOLD" | "PLATINUM")}
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {COMMON_TIERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} ({t.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Standard Payment Terms <span className="text-error">*</span>
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

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Initial Credit Limit (₹ INR) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  required
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  City <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Hyderabad"
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  State <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Telangana"
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Primary Contact */}
          <div>
            <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary" data-icon="person">
                person
              </span>
              <span>Primary Buyer Contact</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Contact Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Rajesh Nair"
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Business Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. rajesh.nair@company.example"
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Mobile / Phone Number
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  placeholder="e.g. VP Procurement"
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between">
          <Link
            href="/quotations/new"
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
                <span>Creating Customer...</span>
              </>
            ) : (
              <>
                <span>Save Customer &amp; Continue</span>
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
