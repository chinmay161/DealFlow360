"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDiscountPolicyAction,
  deleteDiscountPolicyAction,
  toggleDiscountPolicyAction,
  createApprovalRuleAction,
  deleteApprovalRuleAction,
  toggleApprovalRuleAction,
} from "@/lib/actions/configActions";

interface DiscountPolicyItem {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  value: number | string;
  minOrderAmt?: number | string | null;
  maxDiscount?: number | string | null;
  tier?: string | null;
  isActive: boolean;
}

interface ApprovalRuleItem {
  id: string;
  name: string;
  description?: string | null;
  stage: number;
  threshold: number | string;
  approverRole: string;
  isActive: boolean;
}

interface ConfigurationWorkspaceProps {
  initialPolicies: DiscountPolicyItem[];
  initialRules: ApprovalRuleItem[];
  canManagePolicies?: boolean;
  userRole?: string;
}

export const ConfigurationWorkspace: React.FC<ConfigurationWorkspaceProps> = ({
  initialPolicies,
  initialRules,
  canManagePolicies,
  userRole,
}) => {
  const router = useRouter();
  const isManager = canManagePolicies ?? (userRole === "MANAGER" || userRole === "ADMIN");

  const [activeTab, setActiveTab] = useState<"policies" | "rules">("policies");
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter state
  const [policySearch, setPolicySearch] = useState("");
  const [policyTierFilter, setPolicyTierFilter] = useState("ALL");
  const [ruleSearch, setRuleSearch] = useState("");

  // Policy Form State
  const [policyName, setPolicyName] = useState("");
  const [policyDesc, setPolicyDesc] = useState("");
  const [policyType, setPolicyType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [policyValue, setPolicyValue] = useState("15");
  const [policyTier, setPolicyTier] = useState("GOLD");

  // Rule Form State
  const [ruleName, setRuleName] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");
  const [ruleStage, setRuleStage] = useState(1);
  const [ruleThreshold, setRuleThreshold] = useState("20");
  const [ruleRole, setRuleRole] = useState<"SALES_REP" | "MANAGER" | "FINANCE" | "ADMIN">("MANAGER");

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) {
      setErrorMsg("403 Forbidden: Only Managers are authorized to create policies.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await createDiscountPolicyAction({
        name: policyName,
        description: policyDesc,
        type: policyType,
        value: parseFloat(policyValue),
        tier: policyTier === "ALL" ? undefined : policyTier,
      });
      setIsPolicyModalOpen(false);
      setPolicyName("");
      setPolicyDesc("");
      setFeedback("Discount policy successfully registered.");
      setTimeout(() => setFeedback(null), 3500);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to create policy:", err);
      setErrorMsg(err?.message || "Failed to create policy.");
      setTimeout(() => setErrorMsg(null), 4500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePolicy = async (id: string, nextActive: boolean) => {
    if (!isManager) {
      setErrorMsg("403 Forbidden: Only Managers are authorized to modify policies.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    try {
      await toggleDiscountPolicyAction(id, nextActive);
      setFeedback(`Discount policy status updated to ${nextActive ? "Active" : "Inactive"}.`);
      setTimeout(() => setFeedback(null), 3500);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to toggle policy:", err);
      setErrorMsg(err?.message || "Failed to toggle policy.");
      setTimeout(() => setErrorMsg(null), 4500);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!isManager) {
      setErrorMsg("403 Forbidden: Only Managers are authorized to delete policies.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    if (!confirm("Are you sure you want to remove this discount policy?")) return;
    try {
      await deleteDiscountPolicyAction(id);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to delete policy:", err);
      setErrorMsg(err?.message || "Failed to delete policy.");
      setTimeout(() => setErrorMsg(null), 4500);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) {
      setErrorMsg("403 Forbidden: Only Managers are authorized to create approval rules.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await createApprovalRuleAction({
        name: ruleName,
        description: ruleDesc,
        stage: Number(ruleStage),
        threshold: parseFloat(ruleThreshold),
        approverRole: ruleRole,
      });
      setIsRuleModalOpen(false);
      setRuleName("");
      setRuleDesc("");
      setFeedback("Approval governance rule successfully configured.");
      setTimeout(() => setFeedback(null), 3500);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to create rule:", err);
      setErrorMsg(err?.message || "Failed to create approval rule.");
      setTimeout(() => setErrorMsg(null), 4500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (id: string, nextActive: boolean) => {
    if (!isManager) {
      setErrorMsg("403 Forbidden: Only Managers are authorized to modify approval rules.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    try {
      await toggleApprovalRuleAction(id, nextActive);
      setFeedback(`Approval rule status updated to ${nextActive ? "Active" : "Inactive"}.`);
      setTimeout(() => setFeedback(null), 3500);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to toggle rule:", err);
      setErrorMsg(err?.message || "Failed to toggle approval rule.");
      setTimeout(() => setErrorMsg(null), 4500);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!isManager) {
      setErrorMsg("403 Forbidden: Only Managers are authorized to delete approval rules.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    if (!confirm("Are you sure you want to remove this approval rule?")) return;
    try {
      await deleteApprovalRuleAction(id);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to delete rule:", err);
      setErrorMsg(err?.message || "Failed to delete approval rule.");
      setTimeout(() => setErrorMsg(null), 4500);
    }
  };

  // Filtered lists
  const filteredPolicies = initialPolicies.filter((p) => {
    const matchesSearch =
      !policySearch ||
      p.name.toLowerCase().includes(policySearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(policySearch.toLowerCase()));
    const matchesTier =
      policyTierFilter === "ALL" ||
      (p.tier ? p.tier.toUpperCase() === policyTierFilter : false);
    return matchesSearch && matchesTier;
  });

  const filteredRules = initialRules.filter((r) => {
    const matchesSearch =
      !ruleSearch ||
      r.name.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.approverRole.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(ruleSearch.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
            Commercial Governance &amp; Configuration
          </h1>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">
            Configure automated discount guardrails, customer tier limits, and multi-tier approval authority.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F1F5F9] p-1 rounded-lg flex items-center gap-1 border border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab("policies")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "policies"
                  ? "bg-white text-primary shadow-xs"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              Discount Policies ({initialPolicies.length})
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "rules"
                  ? "bg-white text-primary shadow-xs"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              Approval Rules ({initialRules.length})
            </button>
          </div>

          {/* Action buttons: Only rendered for Managers. Hidden for Sales Representatives */}
          {isManager && (
            activeTab === "policies" ? (
              <button
                onClick={() => setIsPolicyModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
                <span>New Policy</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRuleModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-[#1E3A8A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
                <span>New Rule</span>
              </button>
            )
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-emerald-700" data-icon="check_circle">check_circle</span>
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-rose-700" data-icon="error">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: Discount Policies */}
      {activeTab === "policies" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Active Commercial Discount Policies
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search policies..."
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs border border-[#D1D5DB] rounded-md focus:ring-1 focus:ring-primary focus:outline-none bg-white text-on-surface w-44"
                />
                <span className="material-symbols-outlined absolute left-1.5 top-1/2 -translate-y-1/2 text-sm text-outline" data-icon="search">
                  search
                </span>
              </div>
              <select
                value={policyTierFilter}
                onChange={(e) => setPolicyTierFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-[#D1D5DB] rounded-md focus:ring-1 focus:ring-primary focus:outline-none bg-white text-on-surface"
              >
                <option value="ALL">All Tiers</option>
                <option value="GOLD">Gold Tier</option>
                <option value="SILVER">Silver Tier</option>
                <option value="BRONZE">Bronze Tier</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] border-b border-[#E5E7EB] text-outline font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Policy Name &amp; Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Applies To</th>
                  <th className="py-3 px-4 text-right">Max Value / Ceiling</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">{isManager ? "Actions" : "Access"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-outline">
                      {policySearch || policyTierFilter !== "ALL"
                        ? "No discount policies match your search/filter criteria."
                        : "No discount policies configured. System using standard baseline rules."}
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface text-sm">{p.name}</div>
                        <div className="text-[11px] text-outline">{p.description || "Automated tier ceiling guardrail"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-code-tabular font-medium text-on-surface-variant">
                        {p.type}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200">
                          {p.tier || "All Tiers"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-code-tabular font-bold text-primary">
                        {p.type === "PERCENTAGE" ? `${p.value}%` : `₹${p.value}`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {/* Status toggle: interactive for Managers, view-only badge for Sales Representatives */}
                        {isManager ? (
                          <button
                            type="button"
                            onClick={() => handleTogglePolicy(p.id, !p.isActive)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-opacity hover:opacity-80 cursor-pointer ${
                              p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                            title="Click to toggle status"
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {/* Actions: Delete button for Managers, View-only label for Sales Representatives */}
                        {isManager ? (
                          <button
                            onClick={() => handleDeletePolicy(p.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors"
                            title="Delete Policy"
                          >
                            <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-outline italic">View only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Approval Rules */}
      {activeTab === "rules" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Multi-Level Approval Routing Hierarchy
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs border border-[#D1D5DB] rounded-md focus:ring-1 focus:ring-primary focus:outline-none bg-white text-on-surface w-44"
                />
                <span className="material-symbols-outlined absolute left-1.5 top-1/2 -translate-y-1/2 text-sm text-outline" data-icon="search">
                  search
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] border-b border-[#E5E7EB] text-outline font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-center">Stage</th>
                  <th className="py-3 px-4">Rule Title &amp; Authority</th>
                  <th className="py-3 px-4">Approver Role</th>
                  <th className="py-3 px-4 text-right">Discount Threshold</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">{isManager ? "Actions" : "Access"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-outline">
                      {ruleSearch
                        ? "No approval rules match your search criteria."
                        : "No custom approval rules configured. Using default Sales Manager / Finance / Executive hierarchy."}
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold font-code-tabular text-primary">
                        Stage {r.stage}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface text-sm">{r.name}</div>
                        <div className="text-[11px] text-outline">{r.description || "Escalation trigger"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                          {r.approverRole}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-code-tabular font-bold text-on-surface">
                        &gt; {r.threshold}% discount
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {/* Status toggle: interactive for Managers, view-only badge for Sales Representatives */}
                        {isManager ? (
                          <button
                            type="button"
                            onClick={() => handleToggleRule(r.id, !r.isActive)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-opacity hover:opacity-80 cursor-pointer ${
                              r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                            title="Click to toggle status"
                          >
                            {r.isActive ? "Active" : "Inactive"}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {r.isActive ? "Active" : "Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {/* Actions: Delete button for Managers, View-only label for Sales Representatives */}
                        {isManager ? (
                          <button
                            onClick={() => handleDeleteRule(r.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors"
                            title="Delete Rule"
                          >
                            <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-outline italic">View only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Policy (Managers Only) */}
      {isManager && isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">Add Discount Policy</h3>
              <button onClick={() => setIsPolicyModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-base" data-icon="close">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-outline mb-1">Policy Title</label>
                <input
                  type="text"
                  required
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  placeholder="e.g. Enterprise Gold Max Discount"
                  className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-outline mb-1">Description</label>
                <input
                  type="text"
                  value={policyDesc}
                  onChange={(e) => setPolicyDesc(e.target.value)}
                  placeholder="e.g. Cap discount on gold accounts"
                  className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-outline mb-1">Policy Type</label>
                  <select
                    value={policyType}
                    onChange={(e: any) => setPolicyType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-outline mb-1">Ceiling Value</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={policyValue}
                    onChange={(e) => setPolicyValue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-outline mb-1">Applicable Tier</label>
                <select
                  value={policyTier}
                  onChange={(e) => setPolicyTier(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                >
                  <option value="ALL">All Account Tiers</option>
                  <option value="GOLD">Gold Tier</option>
                  <option value="SILVER">Silver Tier</option>
                  <option value="BRONZE">Bronze Tier</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-[#D1D5DB] text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-md bg-primary hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Create Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Rule (Managers Only) */}
      {isManager && isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">Add Approval Rule</h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-base" data-icon="close">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-outline mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Level 2 Finance Margin Governance"
                  className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-outline mb-1">Workflow Stage</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={ruleStage}
                    onChange={(e) => setRuleStage(parseInt(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-outline mb-1">Trigger Threshold (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={ruleThreshold}
                    onChange={(e) => setRuleThreshold(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-outline mb-1">Required Approver Role</label>
                <select
                  value={ruleRole}
                  onChange={(e: any) => setRuleRole(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                >
                  <option value="MANAGER">Sales Manager</option>
                  <option value="FINANCE">Commercial Finance</option>
                  <option value="ADMIN">Executive / Board Admin</option>
                  <option value="SALES_REP">Sales Representative</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-[#D1D5DB] text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-md bg-primary hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
