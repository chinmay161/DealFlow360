"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { toggleContactPortalAccessAction } from "@/lib/actions/portalAuthActions";
import { updateCustomerOwnerAction } from "@/lib/actions/customerActions";

export interface AccountOwnerOption {
  id: string;
  name: string | null;
  email: string;
  role: string;
  title?: string | null;
  territory?: string | null;
}

export interface CustomerRow {
  id: string;
  customerNumber: string;
  name: string;
  externalAccountId?: string | null;
  industry?: string | null;
  tier: string;
  paymentTerms?: string | null;
  creditLimit: number;
  creditAvailable: number;
  territory?: string | null;
  city?: string | null;
  state?: string | null;
  activeStatus: boolean;
  quotationCount: number;
  owner?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    title?: string | null;
    territory?: string | null;
  } | null;
  primaryContact?: {
    id?: string;
    name: string;
    title?: string | null;
    email: string;
    portalAccess?: boolean;
    isActive?: boolean;
  } | null;
}

interface CustomerDirectoryTableProps {
  customers: CustomerRow[];
  availableOwners?: AccountOwnerOption[];
}

export const CustomerDirectoryTable: React.FC<CustomerDirectoryTableProps> = ({
  customers: initialCustomers,
  availableOwners = [],
}) => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Reassign Modal State
  const [reassigningCustomer, setReassigningCustomer] = useState<CustomerRow | null>(null);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>("");
  const [isUpdatingOwner, setIsUpdatingOwner] = useState(false);
  const [ownerUpdateMessage, setOwnerUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleOpenReassignModal = (customer: CustomerRow) => {
    setReassigningCustomer(customer);
    setSelectedNewOwnerId(customer.owner?.id || availableOwners[0]?.id || "");
    setOwnerUpdateMessage(null);
  };

  const handleCloseReassignModal = () => {
    if (isUpdatingOwner) return;
    setReassigningCustomer(null);
    setOwnerUpdateMessage(null);
  };

  const handleReassignOwner = async () => {
    if (!reassigningCustomer || !selectedNewOwnerId) return;
    setIsUpdatingOwner(true);
    setOwnerUpdateMessage(null);

    try {
      const res = await updateCustomerOwnerAction(reassigningCustomer.id, selectedNewOwnerId);
      if (res.success && res.newOwner) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.id === reassigningCustomer.id) {
              return {
                ...c,
                owner: res.newOwner as any,
              };
            }
            return c;
          })
        );
        setOwnerUpdateMessage({ type: "success", text: "Account owner successfully reassigned!" });
        setTimeout(() => {
          setReassigningCustomer(null);
          setOwnerUpdateMessage(null);
        }, 1000);
      } else {
        setOwnerUpdateMessage({ type: "error", text: res.error || "Failed to update account owner" });
      }
    } catch (err: any) {
      setOwnerUpdateMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setIsUpdatingOwner(false);
    }
  };

  const handleTogglePortal = async (contactId: string, newStatus: boolean) => {
    setTogglingId(contactId);
    try {
      const res = await toggleContactPortalAccessAction(contactId, newStatus);
      if (res.success) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.primaryContact?.id === contactId) {
              return {
                ...c,
                primaryContact: {
                  ...c.primaryContact,
                  portalAccess: newStatus,
                },
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error("Failed to toggle portal access:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.externalAccountId && c.externalAccountId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.territory && c.territory.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.owner?.name && c.owner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.owner?.email && c.owner.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = tierFilter === "ALL" || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F8FAFC]">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm" data-icon="search">
              search
            </span>
            <input
              type="text"
              placeholder="Search by customer, ID, owner, account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs text-on-surface bg-white focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs font-semibold text-on-surface bg-white shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Account Tiers</option>
            <option value="GOLD">Gold Preferred Tier</option>
            <option value="SILVER">Silver Commercial Tier</option>
            <option value="BRONZE">Bronze Standard Tier</option>
          </select>

          <Link
            href="/customers/new"
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
            <span>Register Customer</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F1F5F9] border-b border-[#E5E7EB] text-outline font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Customer ID</th>
              <th className="py-3 px-4">Enterprise Account</th>
              <th className="py-3 px-4">Account Owner</th>
              <th className="py-3 px-4">Tier &amp; Industry</th>
              <th className="py-3 px-4">Primary Contact</th>
              <th className="py-3 px-4">Commercial Terms</th>
              <th className="py-3 px-4 text-right">Credit Limit</th>
              <th className="py-3 px-4 text-center">Deals</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-outline">
                  No registered enterprise customers matching current criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const tierColor =
                  c.tier === "GOLD"
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : c.tier === "SILVER"
                    ? "bg-slate-100 text-slate-800 border-slate-300"
                    : "bg-orange-100 text-orange-900 border-orange-300";

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-code-tabular font-bold text-primary">
                      {c.customerNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface text-sm">{c.name}</div>
                      <div className="text-[11px] text-outline">
                        {c.externalAccountId || "Direct Account"} • {c.territory || "Domestic"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {c.owner ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-primary" data-icon="badge">
                              badge
                            </span>
                            <span className="text-primary font-bold">Owner: {c.owner.name || c.owner.email}</span>
                          </div>
                          <div className="text-[11px] text-outline font-mono">{c.owner.email}</div>
                          <div className="text-[10px] text-outline">
                            {c.owner.title || c.owner.role} {c.owner.territory ? `• ${c.owner.territory}` : ""}
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Unassigned Owner
                        </div>
                      )}
                      {availableOwners && availableOwners.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenReassignModal(c)}
                          className="mt-1 text-[10px] text-primary hover:text-[#1E3A8A] hover:underline font-semibold flex items-center gap-1 transition-colors"
                          title="Reassign Account Owner"
                        >
                          <span className="material-symbols-outlined text-[13px]" data-icon="manage_accounts">manage_accounts</span>
                          <span>Change Owner</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${tierColor}`}>
                        {c.tier}
                      </span>
                      <div className="text-[11px] text-outline mt-0.5">{c.industry || "Enterprise"}</div>
                    </td>
                    <td className="py-3 px-4">
                      {c.primaryContact ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-on-surface">{c.primaryContact.name}</div>
                          <div className="text-[11px] text-outline font-mono">{c.primaryContact.email}</div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.primaryContact.portalAccess
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-slate-100 text-slate-700 border border-slate-300"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  c.primaryContact.portalAccess ? "bg-emerald-600" : "bg-slate-400"
                                }`}
                              />
                              {c.primaryContact.portalAccess ? "Portal Access: Enabled" : "Portal Access: Not Registered"}
                            </span>
                            {c.primaryContact.id && (
                              <button
                                type="button"
                                onClick={() => handleTogglePortal(c.primaryContact!.id!, !c.primaryContact!.portalAccess)}
                                disabled={togglingId === c.primaryContact.id}
                                title={c.primaryContact.portalAccess ? "Disable customer portal access" : "Enable customer portal access"}
                                className="text-[10px] text-primary hover:underline font-semibold disabled:opacity-50"
                              >
                                {togglingId === c.primaryContact.id
                                  ? "Updating..."
                                  : c.primaryContact.portalAccess
                                  ? "Disable"
                                  : "Enable"}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-outline italic">No contact assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-medium">
                      <div>{c.paymentTerms || "Net 30 Days"}</div>
                      <div className="text-[10px] text-outline">{c.city ? `${c.city}, ${c.state || "IN"}` : "India"}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-code-tabular font-semibold text-on-surface">
                      {formatCurrency(c.creditLimit, "INR")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {c.quotationCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/quotations/new?customerId=${c.id}`}
                        className="px-2.5 py-1 rounded border border-[#D1D5DB] hover:bg-white text-on-surface font-semibold text-[11px] inline-flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-xs" data-icon="post_add">post_add</span>
                        <span>Create Quote</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reassign Account Owner Modal */}
      {reassigningCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm font-bold text-on-surface text-base">
                  Reassign Account Owner
                </h3>
                <p className="text-xs text-outline mt-0.5">
                  Update designated internal Sales Representative for this account
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseReassignModal}
                disabled={isUpdatingOwner}
                className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-lg" data-icon="close">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {ownerUpdateMessage && (
                <div
                  className={`p-3 rounded-lg border text-xs font-semibold ${
                    ownerUpdateMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {ownerUpdateMessage.text}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-on-surface text-sm">{reassigningCustomer.name}</div>
                <div className="text-outline font-code-tabular">
                  {reassigningCustomer.customerNumber} • {reassigningCustomer.territory || "Domestic"} • {reassigningCustomer.tier} Tier
                </div>
                <div className="text-[11px] text-outline pt-1">
                  Current Owner:{" "}
                  <span className="font-semibold text-on-surface">
                    {reassigningCustomer.owner
                      ? `${reassigningCustomer.owner.name || reassigningCustomer.owner.email} (${reassigningCustomer.owner.email})`
                      : "None"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface">
                  Select New Internal Account Owner <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedNewOwnerId}
                  onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                  disabled={isUpdatingOwner}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-xs font-medium text-on-surface bg-white shadow-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="" disabled>-- Select Authorized Internal Representative --</option>
                  {availableOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name || owner.email} — {owner.title || owner.role} · {owner.email} ({owner.territory || "General"})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-outline">
                  Only authorized internal staff (Sales Reps, Commercial Managers, Administrators) can own enterprise customer accounts.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 leading-relaxed">
                <strong>Governance Note:</strong> Reassigning the account owner will automatically shift future quotation visibility, account-scoped searches, and notification routing to the new representative. Historical quotation creator and audit log actor attribution will remain permanently preserved.
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseReassignModal}
                disabled={isUpdatingOwner}
                className="px-3.5 py-1.5 rounded-lg border border-[#D1D5DB] hover:bg-white text-on-surface font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignOwner}
                disabled={isUpdatingOwner || !selectedNewOwnerId}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-[#1E3A8A] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isUpdatingOwner ? (
                  <>
                    <span className="material-symbols-outlined text-xs animate-spin" data-icon="progress_activity">progress_activity</span>
                    <span>Reassigning...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xs" data-icon="check">check</span>
                    <span>Confirm Reassignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
