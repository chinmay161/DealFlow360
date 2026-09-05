import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, Calendar } from "lucide-react";
import type { Customer } from "@/types/quotation.types";

interface CustomerInfoCardProps {
  customer: Customer;
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  return (
    <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900/60">
      <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm font-semibold">Customer Account Profile</CardTitle>
        </div>
        <Badge variant="outline" className="font-semibold text-xs">
          {customer.tier} Tier Account
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium block">Company Name</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block text-sm">
            {customer.name}
          </span>
          <span className="text-[11px] text-slate-500">{customer.industry || "Enterprise"}</span>
        </div>

        <div>
          <span className="text-slate-400 font-medium block">Commercial Terms</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {customer.paymentTerms || "Net 30 Days"}
          </span>
          <span className="text-[11px] text-slate-500">Standard invoice cycle</span>
        </div>

        <div>
          <span className="text-slate-400 font-medium block">Approved Credit Limit</span>
          <span className="font-semibold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block">
            ₹{customer.creditLimit.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">Underwritten exposure</span>
        </div>

        <div>
          <span className="text-slate-400 font-medium block">Available Credit</span>
          <span className="font-semibold font-mono text-emerald-600 mt-0.5 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            ₹{customer.creditAvailable.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">Active credit line</span>
        </div>
      </CardContent>
    </Card>
  );
}
