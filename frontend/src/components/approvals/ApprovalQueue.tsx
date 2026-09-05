"use client";

import React, { useState } from "react";
import { ApprovalItem } from "@/types/approval";

interface ApprovalQueueProps {
  items: ApprovalItem[];
  selectedId: string;
  onSelect: (item: ApprovalItem) => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  items,
  selectedId,
  onSelect,
}) => {
  const [activeTab, setActiveTab] = useState<"my_queue" | "team_queue" | "history">("my_queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Filtered items based on search and filters
  const filteredItems = items.filter((item) => {
    if (priorityFilter !== "all" && item.priority.toLowerCase() !== priorityFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        item.dealId.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        item.currentStage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
      {/* Header & Tabs */}
      <div className="px-space-base pt-space-base pb-0 border-b border-[#E5E7EB] bg-surface-bright">
        <div className="flex items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                Approval Queue
              </h2>
              <span className="px-2 py-0.5 text-label-sm font-semibold rounded-full bg-surface-container-high text-primary">
                {filteredItems.length} Deals
              </span>
            </div>
            <p className="font-body-sm text-[11px] text-outline mt-0.5">
              Deals currently awaiting review.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 text-label-md">
          <button
            onClick={() => setActiveTab("my_queue")}
            className={`pb-2.5 font-semibold transition-colors border-b-2 ${
              activeTab === "my_queue"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            My Queue
          </button>
          <button
            onClick={() => setActiveTab("team_queue")}
            className={`pb-2.5 font-medium transition-colors border-b-2 ${
              activeTab === "team_queue"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            Team Queue
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 font-medium transition-colors border-b-2 ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="p-space-sm bg-[#F8F9FA] border-b border-[#E5E7EB] flex items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span
            className="material-symbols-outlined absolute left-2.5 top-2 text-[#64748B] text-[16px]"
            data-icon="search"
          >
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search approvals..."
            className="w-full h-8 pl-8 pr-3 text-body-sm font-body-sm rounded-md bg-white border border-[#D1D5DB] text-on-surface placeholder-[#9CA3AF] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 px-2 text-label-sm rounded-md bg-white border border-[#D1D5DB] text-on-surface focus:outline-none focus:border-secondary"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 text-label-sm rounded-md bg-white border border-[#D1D5DB] text-on-surface focus:outline-none focus:border-secondary"
          >
            <option value="all">All Statuses</option>
            <option value="awaiting review">Awaiting Review</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-8 px-2 text-label-sm rounded-md bg-white border border-[#D1D5DB] text-on-surface focus:outline-none focus:border-secondary"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="value">Sort: Value (High to Low)</option>
            <option value="risk">Sort: Risk Score</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider">
              <th className="py-2.5 px-space-base font-semibold">Deal</th>
              <th className="py-2.5 px-space-md font-semibold">Customer</th>
              <th className="py-2.5 px-space-md font-semibold text-right w-24">Value</th>
              <th className="py-2.5 px-space-md font-semibold w-28">Risk</th>
              <th className="py-2.5 px-space-md font-semibold w-32">Current Stage</th>
              <th className="py-2.5 px-space-md font-semibold w-24">Submitted</th>
              <th className="py-2.5 px-space-base font-semibold w-36">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">
            {filteredItems.map((item) => {
              const isSelected = item.id === selectedId;

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`cursor-pointer transition-colors group ${
                    isSelected
                      ? "bg-surface-container-low/70 border-l-4 border-l-primary"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  {/* Deal ID */}
                  <td className="py-3 px-space-base">
                    <span
                      className={`font-code-tabular text-body-md font-bold ${
                        isSelected ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      {item.dealId}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-space-md">
                    <div className="font-medium text-on-surface leading-tight">
                      {item.customer}
                    </div>
                    {item.customerGlobalId && (
                      <span className="font-body-sm text-[10px] text-outline block">
                        {item.customerGlobalId}
                      </span>
                    )}
                  </td>

                  {/* Value */}
                  <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                    {item.value}
                  </td>

                  {/* Risk */}
                  <td className="py-3 px-space-md">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.riskCategory === "High"
                          ? "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                          : item.riskCategory === "Medium"
                          ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                          : "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.riskCategory === "High"
                            ? "bg-[#E11D48]"
                            : item.riskCategory === "Medium"
                            ? "bg-[#D97706]"
                            : "bg-[#10B981]"
                        }`}
                      ></span>
                      <span>{item.riskScore} / {item.riskCategory}</span>
                    </span>
                  </td>

                  {/* Current Stage */}
                  <td className="py-3 px-space-md text-body-sm text-[#475569]">
                    {item.currentStage}
                  </td>

                  {/* Submitted */}
                  <td className="py-3 px-space-md font-body-sm text-[11px] text-outline">
                    {item.submittedTimeAgo}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-space-base">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${
                        item.status === "Awaiting Review"
                          ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                          : item.status === "Pending"
                          ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]"
                          : item.status === "Approved"
                          ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                          : "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
