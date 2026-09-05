"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { QuotationForm } from "@/features/quotations/builder/QuotationForm";

export default function NewQuotationPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Link href="/customer/dashboard" className="hover:text-slate-700 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer/quotations" className="hover:text-slate-700 transition-colors">
            Quotations
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            New Commercial Quotation
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Create Commercial Quotation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft enterprise deal pricing with live margin calculation and discount governance.
            </p>
          </div>

          <Link
            href="/customer/quotations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Directory
          </Link>
        </div>
      </div>

      {/* Main Builder Form */}
      <QuotationForm />
    </div>
  );
}
