"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerSelector } from "./CustomerSelector";
import { LineItemsEditor, LineItemDraft } from "./LineItemsEditor";
import { FinancialSummarySidebar } from "./FinancialSummarySidebar";
import { ProductCatalogModal } from "./ProductCatalogModal";
import type { Customer, Product } from "@/types/quotation.types";
import { quotationService } from "@/services/quotation.service";
import { useToast } from "@/components/providers/ToastProvider";

export function QuotationForm() {
  const router = useRouter();
  const toast = useToast();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ customer?: string; lineItems?: string }>({});

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (item.discountPercent / 100),
    0
  );
  const netValue = subtotal - discountTotal;
  const taxTotal = lineItems.reduce(
    (sum, item) =>
      sum + (item.quantity * item.unitPrice * (1 - item.discountPercent / 100)) * (item.taxRate / 100),
    0
  );
  const grandTotal = netValue + taxTotal;

  // Margin calculation (~65% assumed base cost)
  const totalCost = lineItems.reduce((sum, item) => sum + item.quantity * (item.unitPrice * 0.65), 0);
  const totalMargin = netValue - totalCost;
  const marginPercent = netValue > 0 ? (totalMargin / netValue) * 100 : 35;

  // Estimated Risk Score
  let estimatedRisk = 15;
  if (marginPercent < 20) estimatedRisk += 30;
  if (discountTotal > subtotal * 0.15) estimatedRisk += 25;
  if (grandTotal > 500000) estimatedRisk += 15;
  estimatedRisk = Math.min(95, Math.max(10, estimatedRisk));

  // Line item handlers
  const handleAddProductFromCatalog = (product: Product) => {
    const newItem: LineItemDraft = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.unitPrice,
      discountPercent: 5,
      taxRate: product.taxRate || 18,
    };
    setLineItems((prev) => [...prev, newItem]);
    setErrors((prev) => ({ ...prev, lineItems: undefined }));
  };

  const handleAddCustomItem = () => {
    const customItem: LineItemDraft = {
      id: `custom-${Date.now()}`,
      productName: "Custom Professional Service",
      sku: "SVC-CUSTOM",
      quantity: 1,
      unitPrice: 25000,
      discountPercent: 0,
      taxRate: 18,
    };
    setLineItems((prev) => [...prev, customItem]);
    setErrors((prev) => ({ ...prev, lineItems: undefined }));
  };

  const handleUpdateLineItem = (index: number, updates: Partial<LineItemDraft>) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateLineItem = (index: number) => {
    setLineItems((prev) => {
      const target = prev[index];
      const cloned: LineItemDraft = {
        ...target,
        id: `line-${Date.now()}`,
        productName: `${target.productName} (Copy)`,
      };
      return [...prev, cloned];
    });
  };

  const validateForm = () => {
    const newErrors: { customer?: string; lineItems?: string } = {};
    if (!selectedCustomer) {
      newErrors.customer = "Please select an enterprise customer.";
    }
    if (lineItems.length === 0) {
      newErrors.lineItems = "Add at least one product before creating a quotation.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submission
  const handleSubmit = async (submitForApproval: boolean) => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const res = await quotationService.createQuotation({
        customerId: selectedCustomer!.id,
        lineItems: lineItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
        })),
      });

      if (submitForApproval) {
        // Trigger transition to PENDING_APPROVAL
        await quotationService.transitionQuotation(res.id, {
          targetState: "PENDING_APPROVAL",
          reason: "Submitted by sales executive from quotation builder",
        });
        toast.success(
          "Quotation submitted",
          `Quotation #${res.quotationNumber} is now pending managerial verification.`
        );
      } else {
        toast.success(
          "Draft saved",
          `Quotation #${res.quotationNumber} saved as draft.`
        );
      }

      router.push(`/customer/quotations/${res.quotationNumber}`);
    } catch (err: any) {
      toast.error("Submission failed", err?.message || "Failed to create quotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Workspace (Col 8) */}
      <div className="lg:col-span-8 space-y-6">
        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(c) => {
            setSelectedCustomer(c);
            setErrors((prev) => ({ ...prev, customer: undefined }));
          }}
          error={errors.customer}
        />

        <LineItemsEditor
          lineItems={lineItems}
          customerTierLimit={
            selectedCustomer?.tier === "PLATINUM"
              ? 25
              : selectedCustomer?.tier === "GOLD"
              ? 20
              : selectedCustomer?.tier === "SILVER"
              ? 15
              : 10
          }
          onUpdateLineItem={handleUpdateLineItem}
          onRemoveLineItem={handleRemoveLineItem}
          onDuplicateLineItem={handleDuplicateLineItem}
          onOpenCatalog={() => setCatalogModalOpen(true)}
          onAddCustomItem={handleAddCustomItem}
          error={errors.lineItems}
        />
      </div>

      {/* Summary Sidebar (Col 4) */}
      <div className="lg:col-span-4">
        <FinancialSummarySidebar
          subtotal={subtotal}
          discountTotal={discountTotal}
          taxTotal={taxTotal}
          grandTotal={grandTotal}
          marginPercent={marginPercent}
          estimatedRiskScore={estimatedRisk}
          isSubmitting={isSubmitting}
          lineItemCount={lineItems.length}
          onSaveDraft={() => handleSubmit(false)}
          onSubmitForApproval={() => handleSubmit(true)}
        />
      </div>

      <ProductCatalogModal
        open={catalogModalOpen}
        onOpenChange={setCatalogModalOpen}
        onAddProduct={handleAddProductFromCatalog}
      />
    </div>
  );
}
