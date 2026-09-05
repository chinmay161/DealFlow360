"use client";

import React, { useState, useEffect } from "react";

interface RuleTraceItem {
  id?: string;
  ruleName: string;
  outcome: "PASS" | "FAIL" | "WARN" | "SKIP";
  computedValue?: number;
  threshold?: number;
  explanation?: string;
  evaluatedAt?: string;
  inputs?: any;
}

interface DecisionTraceData {
  quotationId: string;
  quotationNumber: string;
  overallRiskScore: number;
  status: string;
  rules: RuleTraceItem[];
}

interface DecisionTraceModalProps {
  quotationId: string;
  quotationNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionTraceModal: React.FC<DecisionTraceModalProps> = ({
  quotationId,
  quotationNumber,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<DecisionTraceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"rules" | "json">("rules");

  useEffect(() => {
    if (!isOpen || !quotationId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/governance/decision-trace?quotationId=${quotationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((trace) => {
        if (!isMounted) return;
        if (trace && Array.isArray(trace.rules)) {
          setData(trace);
        } else {
          setData({
            quotationId,
            quotationNumber,
            overallRiskScore: 0,
            status: "PENDING_EVALUATION",
            rules: [],
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setData({
            quotationId,
            quotationNumber,
            overallRiskScore: 0,
            status: "PENDING_EVALUATION",
            rules: [],
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, quotationId, quotationNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="account_tree">
              account_tree
            </span>
            <div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Decision Trace &amp; Rule Governance
              </h3>
              <p className="text-body-sm text-xs text-outline">
                Quotation: <strong className="text-on-surface font-code-tabular">{quotationNumber}</strong> • Trace ID: {quotationId.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-outline hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg" data-icon="close">
              close
            </span>
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 border-b border-[#E5E7EB] flex items-center gap-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "rules"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm" data-icon="rule">
              rule
            </span>
            <span>Evaluated Rules ({data?.rules?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("json")}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "json"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm" data-icon="code">
              code
            </span>
            <span>Raw Audit JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-outline">
              <span className="material-symbols-outlined text-3xl animate-spin" data-icon="progress_activity">
                progress_activity
              </span>
              <p className="text-xs font-medium mt-2">Loading decision trace from PostgreSQL...</p>
            </div>
          ) : activeTab === "rules" ? (
            <>
              {/* Risk Summary Badge Banner */}
              <div className="p-4 rounded-lg bg-slate-50 border border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                    Synthesized Deal Risk Score
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-metric-display text-2xl font-bold text-on-surface">
                      {data?.overallRiskScore ?? 72}/100
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
                      {(data?.overallRiskScore ?? 0) >= 70 ? "Critical Governance Level" : "Standard Review"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-outline block">Quotation State</span>
                  <span className="font-label-md text-xs font-bold text-primary">
                    {data?.status || "IN_REVIEW"}
                  </span>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                {!data?.rules || data.rules.length === 0 ? (
                  <div className="py-12 text-center text-outline bg-slate-50/50 rounded-xl border border-dashed border-[#E5E7EB]">
                    <span className="material-symbols-outlined text-4xl opacity-40 mb-2 block" data-icon="policy">
                      policy
                    </span>
                    <p className="text-body-md font-semibold text-on-surface">
                      No Automated Decision Trace Recorded Yet
                    </p>
                    <p className="text-body-sm text-outline mt-1 max-w-md mx-auto">
                      Automated rule traces are logged when quotations undergo commercial validation, margin safety checks, or approval workflows.
                    </p>
                  </div>
                ) : (
                  data.rules.map((rule, idx) => {
                    const isFail = rule.outcome === "FAIL";
                    const isWarn = rule.outcome === "WARN";

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border transition-all ${
                          isFail
                            ? "bg-[#FFF5F5] border-[#FECDD3]"
                            : isWarn
                            ? "bg-[#FFFDF5] border-[#FDE68A]"
                            : "bg-white border-[#E5E7EB]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`material-symbols-outlined text-base mt-0.5 ${
                                isFail ? "text-[#E11D48]" : isWarn ? "text-[#D97706]" : "text-[#10B981]"
                              }`}
                              data-icon={isFail ? "cancel" : isWarn ? "warning" : "check_circle"}
                            >
                              {isFail ? "cancel" : isWarn ? "warning" : "check_circle"}
                            </span>
                            <div>
                              <h4 className="font-title-md text-xs font-bold text-on-surface">
                                {rule.ruleName}
                              </h4>
                              <p className="text-body-sm text-[11px] text-on-surface-variant mt-1">
                                {rule.explanation}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              isFail
                                ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                                : isWarn
                                ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                                : "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                            }`}
                          >
                            {rule.outcome}
                          </span>
                        </div>

                        {(rule.computedValue !== undefined || rule.threshold !== undefined) && (
                          <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] text-outline font-code-tabular">
                            <span>Computed: <strong>{rule.computedValue}%</strong></span>
                            <span>Policy Threshold: <strong>{rule.threshold}%</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-code-tabular text-xs overflow-x-auto max-h-[400px]">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-outline">
            Governance decision traces stored in PostgreSQL ledger
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `decision-trace-${quotationNumber || "quote"}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D1D5DB] text-on-surface hover:bg-slate-100 font-label-md text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm" data-icon="download">
                download
              </span>
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover font-label-md text-xs font-semibold shadow-sm transition-colors"
            >
              Close Trace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
