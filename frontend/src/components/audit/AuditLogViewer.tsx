"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Clock,
  ArrowRight,
  User,
  X,
} from "lucide-react";

export interface AuditLogItem {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  fromState?: string | null;
  toState?: string | null;
  metadata?: any;
  createdAt: string | Date;
}

interface AuditLogViewerProps {
  initialLogs: AuditLogItem[];
}

export function AuditLogViewer({ initialLogs }: AuditLogViewerProps) {
  const [logs] = useState<AuditLogItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.entityId.toLowerCase().includes(search.toLowerCase()) ||
      (log.actorEmail && log.actorEmail.toLowerCase().includes(search.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(search.toLowerCase()));

    const matchesEntity =
      selectedEntity === "ALL" ||
      log.entity.toUpperCase() === selectedEntity.toUpperCase();

    const matchesAction =
      selectedAction === "ALL" ||
      log.action.toUpperCase() === selectedAction.toUpperCase();

    return matchesSearch && matchesEntity && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("APPROV") || act.includes("CREATE") || act.includes("ACCEPT")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (act.includes("REJECT") || act.includes("DELETE") || act.includes("CANCEL")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    if (act.includes("UPDATE") || act.includes("TRANSITION") || act.includes("RETURN")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    return "bg-primary/10 text-primary border-primary/20";
  };

  const entities = Array.from(new Set(logs.map((l) => l.entity.toUpperCase())));

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            placeholder="Search by ID, actor email, action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-lg border border-outline-variant/40 text-on-surface text-body-sm focus:outline-none focus:border-primary placeholder:text-outline/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-outline" />
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-3 py-2 bg-surface-container rounded-lg border border-outline-variant/40 text-on-surface text-body-sm focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Entities</option>
              {entities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 bg-surface-container rounded-lg border border-outline-variant/40 text-on-surface text-body-sm focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="TRANSITION">TRANSITION</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
            </select>
          </div>

          <div className="text-body-sm text-outline ml-auto">
            {filteredLogs.length} event{filteredLogs.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container/60 text-outline text-label-sm font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">State Shift</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-outline">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.createdAt);
                  const formattedDate = !isNaN(date.getTime())
                    ? date.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : String(log.createdAt);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-surface-container transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-label-sm text-outline whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-outline/70" />
                          {formattedDate}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-on-surface">
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest/60 text-label-sm border border-outline-variant/30 font-mono">
                          {log.entity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-body-sm text-on-surface-variant max-w-[150px] truncate" title={log.entityId}>
                        {log.entityId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.fromState || log.toState ? (
                          <div className="flex items-center gap-1.5 text-label-sm font-mono">
                            <span className="text-outline truncate max-w-[80px]">
                              {log.fromState || "None"}
                            </span>
                            <ArrowRight className="w-3 h-3 text-outline/60 shrink-0" />
                            <span className="font-semibold text-primary truncate max-w-[80px]">
                              {log.toState || "None"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-outline/40 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-on-surface text-body-sm">
                          <User className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {log.actorEmail || log.actorId || "System"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setInspectLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-label-sm font-medium text-primary hover:bg-primary/10 rounded border border-transparent hover:border-primary/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Detail Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/40 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20 bg-surface-container-high">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-title-md text-on-surface font-semibold">
                    Audit Event Payload
                  </h3>
                  <p className="font-mono text-label-sm text-outline">
                    ID: {inspectLog.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1 rounded-lg hover:bg-surface-container-highest text-outline hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 text-body-sm">
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
                  <span className="text-label-sm text-outline block">Entity &amp; Target</span>
                  <span className="font-semibold text-on-surface font-mono">
                    {inspectLog.entity}: {inspectLog.entityId}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
                  <span className="text-label-sm text-outline block">Action</span>
                  <span className="font-semibold text-primary">
                    {inspectLog.action}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
                  <span className="text-label-sm text-outline block">Actor</span>
                  <span className="text-on-surface font-mono">
                    {inspectLog.actorEmail || inspectLog.actorId || "System"}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
                  <span className="text-label-sm text-outline block">Timestamp</span>
                  <span className="text-on-surface">
                    {new Date(inspectLog.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-label-sm font-semibold text-outline mb-1.5 block">
                  Metadata &amp; Context Snapshot
                </label>
                <pre className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-label-sm font-mono text-on-surface overflow-x-auto max-h-72">
                  {JSON.stringify(inspectLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-high flex justify-end">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-primary text-on-primary font-medium rounded-lg hover:bg-primary-hover transition-colors text-body-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
