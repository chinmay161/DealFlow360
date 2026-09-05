"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <QueryProvider>
      <ToastProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased">
          {/* Desktop Persistent Sidebar (hidden on mobile) */}
          <div className="hidden md:flex flex-shrink-0 h-full">
            <Sidebar />
          </div>

          {/* Mobile Collapsible Sidebar Drawer */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative z-10 w-64 max-w-xs h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
                <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          )}

          {/* Main Viewport Container */}
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            <TopNav onOpenMobileMenu={() => setMobileMenuOpen(true)} />

            {/* Scrollable Main Workspace Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">{children}</div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </QueryProvider>
  );
}
