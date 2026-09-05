"use client";

import React, { useState } from "react";
import { ManagerSidebar } from "./components/ManagerSidebar";
import { ManagerTopHeader } from "./components/ManagerTopHeader";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <QueryProvider>
      <ToastProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-background text-on-surface antialiased font-sans">
          {/* Desktop Persistent Sidebar (260px) */}
          <div className="hidden md:flex flex-shrink-0 h-full">
            <ManagerSidebar />
          </div>

          {/* Mobile Collapsible Sidebar Drawer */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative z-10 w-[260px] max-w-xs h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
                <ManagerSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          )}

          {/* Main Viewport Container */}
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            <ManagerTopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

            {/* Scrollable Main Workspace Content */}
            <main className="flex-1 overflow-y-auto bg-background px-space-xl py-space-lg space-y-space-base pb-24">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </QueryProvider>
  );
}
