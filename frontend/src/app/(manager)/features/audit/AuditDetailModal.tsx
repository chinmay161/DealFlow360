"use client";

import React from "react";
import { Shield, Copy, Check } from "lucide-react";
import type { AuditRecordItem } from "../../types/manager.types";

interface AuditDetailModalProps {
  record: AuditRecordItem | null;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!record) return null;

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#D1D5DB] max-w-xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-base font-bold text-on-surface">Audit Record Details</h3>
              <p className="text-[11px] text-slate-400 font-mono">ID: {record.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Action</span>
              <p className="font-semibold text-primary mt-0.5">{record.action}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Entity</span>
              <p className="font-semibold text-slate-700 mt-0.5">{record.entity} (#{record.entityId})</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Actor</span>
              <p className="font-semibold text-slate-700 mt-0.5">{record.user.name} ({record.user.role})</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Timestamp</span>
              <p className="font-semibold text-slate-700 mt-0.5">{new Date(record.timestamp).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-700 block mb-1">Details Summary:</span>
            <p className="p-2.5 bg-slate-100 rounded text-slate-700 border border-slate-200 font-mono text-[11px]">
              {record.details}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-700">Raw Immutable Payload:</span>
              <button
                type="button"
                onClick={copyPayload}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-52">
              {JSON.stringify(record.metadata || record, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-[#1E3A8A] text-on-primary shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
