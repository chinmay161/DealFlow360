"use client";

import React, { useState, useEffect } from "react";
import { X, History, User, Clock, ArrowRight, CheckCircle, FileText } from "lucide-react";

interface HistoryEntry {
  id: string;
  fromState: string;
  toState: string;
  actorName: string;
  actorRole: string;
  reason?: string;
  createdAt: string;
}

interface AuditHistoryDrawerProps {
  quotationId: string | null;
  quotationNumber: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditHistoryDrawer: React.FC<AuditHistoryDrawerProps> = ({
  quotationId,
  quotationNumber,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !quotationId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/quotations/${encodeURIComponent(quotationId)}/history`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted) {
          setHistory(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.warn("[AuditHistoryDrawer] Fetch error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, quotationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">State Transition Ledger</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Quote: <span className="font-bold text-slate-800">{quotationNumber || quotationId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading lifecycle audit history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No Prior Transitions</p>
              <p className="text-xs text-slate-400 mt-1">This quotation is in its initial creation state.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {history.map((entry, idx) => {
                const dateStr = new Date(entry.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div key={entry.id || idx} className="relative group">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {entry.fromState}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {entry.toState}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {dateStr}
                        </span>
                      </div>

                      {entry.reason && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{entry.reason}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-700">{entry.actorName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                          {entry.actorRole}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Audited State Machine Trail</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
