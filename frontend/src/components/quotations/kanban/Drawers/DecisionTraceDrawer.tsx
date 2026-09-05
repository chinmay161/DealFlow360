"use client";

import React, { useState, useEffect } from "react";
import { X, Download, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, FileCode } from "lucide-react";

interface RuleTraceItem {
  ruleId?: string;
  ruleName: string;
  outcome: "PASS" | "FAIL" | "WARN" | "SKIP";
  severity?: string;
  computedValue?: number;
  threshold?: number;
  explanation?: string;
  inputs?: Record<string, any>;
  recommendation?: string | null;
}

interface DecisionTraceData {
  quotationId: string;
  quotationNumber: string;
  overallRiskScore?: number;
  status?: string;
  summary?: {
    overallDecision?: string;
    approvalLevel?: string;
    riskScore?: number;
    totalRules?: number;
    passedCount?: number;
    failedCount?: number;
    warningCount?: number;
    recommendations?: string[];
  };
  rules?: RuleTraceItem[];
  entries?: RuleTraceItem[];
}

interface DecisionTraceDrawerProps {
  quotationId: string | null;
  quotationNumber: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionTraceDrawer: React.FC<DecisionTraceDrawerProps> = ({
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

    // Try primary governance route then fallback
    fetch(`/api/governance/decision-trace?quotationId=${encodeURIComponent(quotationId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((trace) => {
        if (!isMounted) return;
        if (trace && (Array.isArray(trace.rules) || Array.isArray(trace.entries))) {
          setData(trace);
        } else {
          // Fallback to quotation route
          return fetch(`/api/quotations/${encodeURIComponent(quotationId)}/decision-trace`)
            .then((r) => (r.ok ? r.json() : null))
            .then((secondTrace) => {
              if (isMounted) setData(secondTrace);
            });
        }
      })
      .catch((err) => {
        console.warn("[DecisionTraceDrawer] Fetch error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, quotationId]);

  if (!isOpen) return null;

  const rulesList: RuleTraceItem[] = data?.rules || data?.entries || [];
  const riskScore = data?.overallRiskScore ?? data?.summary?.riskScore ?? 35;
  const isHighRisk = riskScore >= 70;
  const isMediumRisk = riskScore >= 40 && riskScore < 70;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Decision Trace &amp; Governance</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Quote: <span className="font-bold text-slate-800">{quotationNumber || quotationId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-200 flex gap-6 bg-white">
          <button
            onClick={() => setActiveTab("rules")}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "rules"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Evaluated Rules ({rulesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "json"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Raw Ledger JSON</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Querying Rule Engine audit logs...</span>
            </div>
          ) : activeTab === "rules" ? (
            <>
              {/* Risk Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Composite Risk Assessment
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{riskScore} / 100</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        isHighRisk
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isMediumRisk
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {isHighRisk ? "Critical Governance" : isMediumRisk ? "Medium Review" : "Low Risk (Healthy)"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Approval Requirement
                  </span>
                  <span className="text-xs font-bold text-blue-700 mt-1 block">
                    {data?.summary?.approvalLevel || (isHighRisk ? "Finance Director" : "Sales Manager")}
                  </span>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                {rulesList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs font-semibold">No individual rule exceptions triggered.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Quotation meets baseline commercial guidelines.
                    </p>
                  </div>
                ) : (
                  rulesList.map((rule, idx) => {
                    const isFail = rule.outcome === "FAIL";
                    const isWarn = rule.outcome === "WARN";

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isFail
                            ? "bg-rose-50/50 border-rose-200"
                            : isWarn
                            ? "bg-amber-50/40 border-amber-200"
                            : "bg-white border-slate-200 shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {isFail ? (
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            ) : isWarn ? (
                              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{rule.ruleName}</h4>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {rule.explanation}
                              </p>
                              {rule.recommendation && (
                                <p className="text-[11px] font-semibold text-blue-700 bg-blue-50/80 px-2 py-1 rounded mt-2 border border-blue-100">
                                  Recommendation: {rule.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase border ${
                              isFail
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : isWarn
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}
                          >
                            {rule.outcome}
                          </span>
                        </div>

                        {/* Input values breakdown */}
                        {rule.inputs && Object.keys(rule.inputs).length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-black/5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                            {Object.entries(rule.inputs).map(([k, v]) => (
                              <div key={k} className="bg-black/5 p-1.5 rounded">
                                <span className="text-[9px] text-slate-400 uppercase block">
                                  {k.replace(/([A-Z])/g, " $1")}
                                </span>
                                <strong className="text-slate-800 text-[11px] truncate block">
                                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                </strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px]">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">PostgreSQL Governance Ledger v1.2</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `decision-trace-${quotationNumber || "quote"}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
