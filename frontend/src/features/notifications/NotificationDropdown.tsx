"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, FileText, MessageSquare, AlertCircle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import { cn } from "@/components/ui/card";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) markAsRead(item.id);
                  }}
                  className={cn(
                    "p-3.5 transition-colors hover:bg-slate-50 flex items-start gap-3 cursor-pointer",
                    !item.read ? "bg-blue-50/30" : ""
                  )}
                >
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 mt-0.5 flex-shrink-0">
                    {item.category.includes("COMMENT") ? (
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    ) : item.category.includes("REJECT") ? (
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                    {item.quotationNumber && (
                      <Link
                        href={`/customer/quotations/${item.quotationNumber}`}
                        onClick={() => setIsOpen(false)}
                        className="inline-block mt-1 text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        View Quotation #{item.quotationNumber} →
                      </Link>
                    )}
                  </div>

                  {!item.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 text-center bg-slate-50/50">
            <Link
              href="/quotations"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              View all quotations →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
