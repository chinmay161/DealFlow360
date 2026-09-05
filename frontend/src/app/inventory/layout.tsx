"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { QueryProvider } from "@/components/providers/QueryProvider";
import {
  Boxes,
  Building2,
  Package,
  Bookmark,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  UserCheck,
  Shield,
} from "lucide-react";
import { GlobalInventorySearch } from "@/features/inventory/components/GlobalInventorySearch";
import { InventoryRoleProvider, useInventoryRole } from "@/features/inventory/context/InventoryRoleContext";

function InventoryLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useInventoryRole();

  const navTabs = [
    { label: "Overview", href: "/inventory", icon: Boxes },
    { label: "Warehouses", href: "/inventory/warehouses", icon: Building2 },
    { label: "Products & Stock", href: "/inventory/products", icon: Package },
    { label: "Reservations", href: "/inventory/reservations", icon: Bookmark },
    { label: "Shipments", href: "/inventory/shipments", icon: Truck },
    { label: "Trends", href: "/inventory/trends", icon: TrendingUp },
    { label: "Alerts & Insights", href: "/inventory/alerts", icon: AlertTriangle },
  ];

  const handleGlobalSearch = (query: string) => {
    router.push(`/inventory/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Enterprise Application Bar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-xs">
        {/* Brand & Module Identity */}
        <div className="flex items-center gap-4">
          <Link
            href="/overview"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Return to Core Overview"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DealFlow360</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Inventory &amp; Visibility Module
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  v1.0 Read-Only
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Search & Interactive Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Global Inventory Search */}
          <div className="hidden md:block w-72">
            <GlobalInventorySearch onSearch={handleGlobalSearch} />
          </div>

          {/* Interactive Role Switcher (Sales Rep vs Manager) */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setRole("SALES_REP")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                role === "SALES_REP"
                  ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="View as Sales Representative (Product lookup & stock availability)"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sales Rep</span>
            </button>

            <button
              onClick={() => setRole("MANAGER")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                role === "MANAGER"
                  ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="View as Manager (Capacity utilization, capital exposure & analytics)"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manager</span>
            </button>
          </div>

          {/* Quick Quotations Link */}
          <Link
            href="/quotations"
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors hidden lg:inline-flex items-center gap-1"
          >
            <span>Quotations</span>
          </Link>
        </div>
      </header>

      {/* Secondary Subnavigation Tabs */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center gap-1 overflow-x-auto flex-shrink-0 scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/inventory"
              ? pathname === "/inventory"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 font-semibold dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <InventoryRoleProvider>
        <InventoryLayoutContent>{children}</InventoryLayoutContent>
      </InventoryRoleProvider>
    </QueryProvider>
  );
}
