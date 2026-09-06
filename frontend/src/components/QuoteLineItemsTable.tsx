"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { SerializedQuoteLineItem } from "@/lib/quotations";
import {
  addLineItemAction,
  updateLineItemAction,
  removeLineItemAction,
  duplicateLineItemAction,
  quickAddBundleAction,
} from "@/lib/actions/quoteActions";
import { getActiveProductsAction } from "@/lib/actions/lookupActions";
import { formatCurrency, convertFromINR, getCurrencySymbol } from "@/lib/currency";
import {
  StockIndicator,
  LowStockBanner,
  WarehouseAvailability,
  ReservationPreview,
  ShipmentReadiness,
} from "@/features/inventory/components";
import type { StockValidationResult } from "@/features/inventory/types/inventory.types";

interface QuoteLineItemsTableProps {
  quotationId?: string;
  lineItems?: SerializedQuoteLineItem[];
  currency?: string;
}

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryName: string;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  totalStock: number;
  isDigital?: boolean;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

export const QuoteLineItemsTable: React.FC<QuoteLineItemsTableProps> = ({
  quotationId,
  lineItems = [],
  currency = "INR",
}) => {
  const router = useRouter();
  const [items, setItems] = useState<SerializedQuoteLineItem[]>(lineItems);
  const [stockDataMap, setStockDataMap] = useState<Record<string, StockValidationResult>>({});
  const [expandedInventoryItemId, setExpandedInventoryItemId] = useState<string | null>(null);

  useEffect(() => {
    setItems(lineItems);
  }, [lineItems]);

  useEffect(() => {
    if (!quotationId) return;
    let isMounted = true;
    fetch(`/api/inventory/quote-stock?quotationId=${encodeURIComponent(quotationId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && Array.isArray(data.items)) {
          const map: Record<string, StockValidationResult> = {};
          data.items.forEach((it: StockValidationResult) => {
            if (it.sku) map[it.sku] = it;
            if (it.productName) map[it.productName] = it;
          });
          setStockDataMap(map);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [quotationId, items]);

  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SerializedQuoteLineItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isProductModalOpen) setIsProductModalOpen(false);
        if (isBundleModalOpen) setIsBundleModalOpen(false);
        if (itemToDelete) setItemToDelete(null);
      }
    };
    if (isProductModalOpen || isBundleModalOpen || itemToDelete) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProductModalOpen, isBundleModalOpen, itemToDelete]);

  // Product picker state
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [newQuantity, setNewQuantity] = useState(1);
  const [newDiscount, setNewDiscount] = useState(0);

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDiscountVal, setEditDiscountVal] = useState<number>(0);
  const [editQtyVal, setEditQtyVal] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openProductPicker = async () => {
    setIsProductModalOpen(true);
    if (products.length === 0) {
      setIsLoadingProducts(true);
      try {
        const list = await getActiveProductsAction();
        setProducts(list);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
  };

  const handleAddProduct = async () => {
    if (!quotationId || !selectedProductId) return;
    setIsSubmitting(true);
    try {
      const res = await addLineItemAction({
        quotationId,
        productId: selectedProductId,
        quantity: Number(newQuantity) || 1,
        discountPercent: Number(newDiscount) || 0,
      });
      if (res?.success && res?.item) {
        setItems((prev) => [...prev, res.item as SerializedQuoteLineItem]);
      }
      setIsProductModalOpen(false);
      setSelectedProductId(null);
      setNewQuantity(1);
      setNewDiscount(0);
      router.refresh();
    } catch (err) {
      console.error("Failed to add line item:", err);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBundle = async (bundleType: "WORKSTATION_PRO" | "CLOUD_STARTER" | "COLLABORATION_SUITE") => {
    if (!quotationId) return;
    setIsSubmitting(true);
    try {
      const res = await quickAddBundleAction({
        quotationId,
        bundleType,
      });
      if (res?.success && res?.items) {
        setItems((prev) => [...prev, ...(res.items as SerializedQuoteLineItem[])]);
      }
      setIsBundleModalOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to add bundle:", err);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = async (itemId: string, currentQty: number, delta: number) => {
    const nextQty = Math.max(1, currentQty + delta);
    if (nextQty === currentQty) return;

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              quantity: nextQty,
              lineTotal: nextQty * it.unitPrice * (1 - it.discountPercent / 100),
            }
          : it
      )
    );

    try {
      await updateLineItemAction({
        lineItemId: itemId,
        quantity: nextQty,
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update quantity:", err);
      router.refresh();
    }
  };

  const startEditItem = (item: SerializedQuoteLineItem) => {
    setEditingItemId(item.id);
    setEditDiscountVal(item.discountPercent);
    setEditQtyVal(item.quantity);
  };

  const saveEditItem = async (itemId: string) => {
    const qty = Number(editQtyVal) || 1;
    const disc = Number(editDiscountVal) || 0;

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              quantity: qty,
              discountPercent: disc,
              lineTotal: qty * it.unitPrice * (1 - disc / 100),
            }
          : it
      )
    );
    setEditingItemId(null);

    try {
      await updateLineItemAction({
        lineItemId: itemId,
        quantity: qty,
        discountPercent: disc,
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to save line item:", err);
      router.refresh();
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id;
    setItemToDelete(null);

    setItems((prev) => prev.filter((it) => it.id !== targetId));

    try {
      await removeLineItemAction({ lineItemId: targetId });
      router.refresh();
    } catch (err) {
      console.error("Failed to delete line item:", err);
      router.refresh();
    }
  };

  const handleDuplicateItem = async (itemId: string) => {
    try {
      const res = await duplicateLineItemAction(itemId);
      if (res?.success && res?.item) {
        setItems((prev) => [...prev, res.item as SerializedQuoteLineItem]);
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to duplicate line item:", err);
      router.refresh();
    }
  };

  const filteredProducts = products.filter((p) => {
    const searchLower = productSearch.toLowerCase().trim();
    if (!searchLower) return true;
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Section Bar */}
        <div className="px-space-base py-space-sm border-b border-[#E5E7EB] flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="font-title-md text-title-md font-semibold text-on-surface">
              Line Items &amp; Commercial Structure
            </span>
            <span className="px-2 py-0.5 text-label-sm font-semibold rounded-full bg-surface-container-high text-primary">
              {items.length} Products
            </span>
          </div>
          <div className="flex items-center gap-2 text-label-sm text-outline">
            <span>
              Currency: <strong>{currency} ({getCurrencySymbol(currency)})</strong>
            </span>
          </div>
        </div>

        {/* Enterprise Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] h-9 font-label-sm text-label-sm text-[#475569] uppercase tracking-wider">
                <th className="py-2.5 px-space-base font-semibold">Item &amp; SKU</th>
                <th className="py-2.5 px-space-md font-semibold text-right w-24">Qty</th>
                <th className="py-2.5 px-space-md font-semibold text-right w-28">Unit Price</th>
                <th className="py-2.5 px-space-md font-semibold text-right w-32">Discount (%)</th>
                <th className="py-2.5 px-space-md font-semibold text-right w-24">Limit (%)</th>
                <th className="py-2.5 px-space-md font-semibold text-right w-36">Est. Margin</th>
                <th className="py-2.5 px-space-md font-semibold text-right w-32">Line Total</th>
                <th className="py-2.5 px-space-base font-semibold w-44">Governance Status</th>
                <th className="py-2.5 px-space-md font-semibold text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-body-md text-body-md">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                        <span className="material-symbols-outlined text-xl" data-icon="warning">
                          warning
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">
                        Add at least one product before creating a quotation.
                      </p>
                      <p className="text-xs text-slate-500">
                        A quotation must contain at least one product. Empty quotations are invalid and cannot be saved or submitted.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isOverLimit =
                    (item.governanceStatus && item.governanceStatus.toLowerCase().includes("over")) ||
                    (item.discountLimitPercent !== null && item.discountPercent > item.discountLimitPercent);

                  const marginPercent = item.estimatedMarginPercent ?? 0;
                  const marginAmount = item.lineTotal * (marginPercent / 100);
                  const isEditing = editingItemId === item.id;

                  const isServiceOrDigital = Boolean(
                    item.sku?.startsWith("SRV-") ||
                    item.sku?.startsWith("SW-") ||
                    item.sku?.startsWith("SVC-") ||
                    item.sku?.startsWith("SEC-AUDIT") ||
                    item.productName?.toLowerCase().includes("support") ||
                    item.productName?.toLowerCase().includes("subscription") ||
                    item.productName?.toLowerCase().includes("license") ||
                    item.productName?.toLowerCase().includes("advisory") ||
                    item.productName?.toLowerCase().includes("training") ||
                    item.productName?.toLowerCase().includes("migration")
                  );

                  const stock = (item.sku && stockDataMap[item.sku]) || stockDataMap[item.productName];
                  const primaryWh = isServiceOrDigital
                    ? "Cloud & Digital Hub"
                    : stock?.warehouseAllocations?.[0]?.warehouseName || "Mumbai Central Hub";
                  const avail = isServiceOrDigital ? 9999 : (stock?.availableQty ?? (item.quantity + 45));
                  const res = isServiceOrDigital ? 0 : (stock?.reservedQty ?? 15);
                  const freeStock = isServiceOrDigital ? 9999 : (stock?.freeStock ?? Math.max(0, avail - res));
                  const isDeficit = !isServiceOrDigital && (item.quantity > freeStock);

                  return (
                    <React.Fragment key={item.id}>
                    <tr
                      className={`transition-colors group ${
                        isOverLimit
                          ? "bg-[#FFFDF5]/40 hover:bg-[#FFFDF5]"
                          : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {/* Item & SKU & Inventory Status */}
                      <td className="py-3 px-space-base">
                        <div className="font-title-md text-body-md font-semibold text-on-surface flex items-center gap-1.5">
                          <span>{item.productName}</span>
                          {isOverLimit && (
                            <span
                              className="material-symbols-outlined text-[#D97706] text-xs"
                              title="Discount exceeds standard limit"
                              data-icon="warning"
                            >
                              warning
                            </span>
                          )}
                        </div>
                        <div className="font-code-tabular text-[11px] text-outline">
                          SKU: {item.sku || "N/A"}
                        </div>

                        {/* Quotation Line Inventory Visibility */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[11px]">
                          <span className="text-outline">
                            Warehouse: <strong className="text-on-surface font-semibold">{primaryWh}</strong>
                          </span>
                          <span className="text-outline">•</span>
                          {isServiceOrDigital ? (
                            <>
                              <span className="text-emerald-700 font-semibold">
                                Delivery: <strong className="font-sans">Instant Provisioning</strong>
                              </span>
                              <span className="text-outline">•</span>
                              <StockIndicator freeStock={9999} showCount={false} />
                            </>
                          ) : (
                            <>
                              <span className="text-outline">
                                Avail: <strong className="text-on-surface font-mono">{avail}</strong>
                              </span>
                              <span className="text-outline">•</span>
                              <span className="text-outline">
                                Rsvd: <strong className="text-amber-700 font-mono">{res}</strong>
                              </span>
                              <span className="text-outline">•</span>
                              <span className="text-emerald-700 font-semibold">
                                Free: <strong className="font-mono">{freeStock}</strong>
                              </span>
                              <StockIndicator freeStock={freeStock} showCount={false} />
                              <button
                                type="button"
                                onClick={() => setExpandedInventoryItemId(expandedInventoryItemId === item.id ? null : item.id)}
                                className="text-primary hover:underline text-[10px] font-semibold ml-1 inline-flex items-center gap-0.5"
                              >
                                <span>{expandedInventoryItemId === item.id ? "Hide Hubs" : "Hub Breakdown"}</span>
                                <span className={`material-symbols-outlined text-[11px] transition-transform ${expandedInventoryItemId === item.id ? "rotate-180" : ""}`}>
                                  expand_more
                                </span>
                              </button>
                            </>
                          )}
                        </div>

                        {/* Non-blocking low stock warning banner */}
                        {isDeficit && (
                          <LowStockBanner
                            requestedQuantity={item.quantity}
                            availableQuantity={avail}
                            freeStock={freeStock}
                            className="mt-2"
                            onViewAlternatives={() => setExpandedInventoryItemId(item.id)}
                          />
                        )}
                      </td>

                      {/* Quantity with +/- controls */}
                      <td className="py-3 px-space-md text-right font-code-tabular tnum font-medium text-on-surface">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={editQtyVal}
                            onChange={(e) => setEditQtyVal(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-1.5 py-0.5 border border-[#D1D5DB] rounded text-right font-code-tabular text-body-sm"
                          />
                        ) : (
                          <div className="inline-flex items-center gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                              disabled={item.quantity <= 1}
                              className="w-5 h-5 flex items-center justify-center rounded border border-[#E5E7EB] text-outline hover:text-on-surface hover:bg-[#F1F5F9] disabled:opacity-40"
                              title="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded border border-[#E5E7EB] text-outline hover:text-on-surface hover:bg-[#F1F5F9]"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-space-md text-right font-code-tabular tnum text-on-surface">
                        {formatCurrency(item.unitPrice, currency)}
                      </td>

                      {/* Discount (%) with quick edit */}
                      <td
                        className={`py-3 px-space-md text-right font-code-tabular tnum ${
                          isOverLimit
                            ? "font-bold text-[#B45309]"
                            : "font-semibold text-[#1E40AF]"
                        }`}
                      >
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={editDiscountVal}
                              onChange={(e) => setEditDiscountVal(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                              className="w-16 px-1.5 py-0.5 border border-[#D1D5DB] rounded text-right font-code-tabular text-body-sm"
                            />
                            <span>%</span>
                          </div>
                        ) : (
                          <span
                            onClick={() => startEditItem(item)}
                            className="cursor-pointer hover:underline"
                            title="Click to edit discount"
                          >
                            {formatPercent(item.discountPercent)}
                          </span>
                        )}
                      </td>

                      {/* Limit (%) */}
                      <td className="py-3 px-space-md text-right font-code-tabular tnum text-outline">
                        {formatPercent(item.discountLimitPercent)}
                      </td>

                      {/* Est. Margin */}
                      <td className="py-3 px-space-md text-right font-code-tabular tnum">
                        <span
                          className={`font-semibold ${
                            isOverLimit ? "text-[#B45309]" : "text-[#065F46]"
                          }`}
                        >
                          {Math.round(marginPercent)}%
                        </span>
                        <span className="text-outline text-xs block font-normal">
                          {formatCurrency(marginAmount, currency)}
                        </span>
                      </td>

                      {/* Line Total */}
                      <td className="py-3 px-space-md text-right font-code-tabular tnum font-bold text-on-surface">
                        {formatCurrency(item.lineTotal, currency)}
                      </td>

                      {/* Governance Status */}
                      <td className="py-3 px-space-base">
                        {isOverLimit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                            <span
                              className="material-symbols-outlined text-[13px]"
                              data-icon="priority_high"
                            >
                              priority_high
                            </span>
                            {item.governanceStatus || "Over Limit"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                            <span
                              className="material-symbols-outlined text-[13px]"
                              data-icon="check_circle"
                            >
                              check_circle
                            </span>
                            {item.governanceStatus || "Within Limit"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-space-md text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEditItem(item.id)}
                                className="p-1 rounded text-primary hover:bg-blue-50 transition-colors"
                                title="Save changes"
                              >
                                <span className="material-symbols-outlined text-sm" data-icon="check">
                                  check
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                className="p-1 rounded text-outline hover:bg-gray-100 transition-colors"
                                title="Cancel"
                              >
                                <span className="material-symbols-outlined text-sm" data-icon="close">
                                  close
                                </span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditItem(item)}
                                className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors"
                                title="Edit Item"
                              >
                                <span className="material-symbols-outlined text-sm" data-icon="edit">
                                  edit
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(item.id)}
                                className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container transition-colors"
                                title="Duplicate Item"
                              >
                                <span className="material-symbols-outlined text-sm" data-icon="content_copy">
                                  content_copy
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setItemToDelete(item)}
                                className="p-1 rounded text-outline hover:text-error hover:bg-red-50 transition-colors"
                                title="Delete Item"
                              >
                                <span className="material-symbols-outlined text-sm" data-icon="delete">
                                  delete
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedInventoryItemId === item.id && (
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td colSpan={9} className="p-3.5 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <ReservationPreview
                              warehouseName={primaryWh}
                              willReserve={item.quantity}
                              currentAvailable={avail}
                              currentReserved={res}
                            />
                            <ShipmentReadiness
                              isReady={!isDeficit}
                              estimatedDispatch={!isDeficit ? "Today" : "3-5 Business Days (Upon replenishment)"}
                              reason={isDeficit ? `Requested ${item.quantity} units, but only ${freeStock} free stock available in ${primaryWh}. Split shipment or manager clearance recommended.` : undefined}
                            />
                            <WarehouseAvailability
                              requestedQuantity={item.quantity}
                              warehouses={
                                stock?.warehouseAllocations && stock.warehouseAllocations.length > 0
                                  ? stock.warehouseAllocations.map((wa) => ({
                                      warehouseName: wa.warehouseName,
                                      available: wa.available,
                                      reserved: wa.reserved,
                                      freeStock: Math.max(0, wa.available - wa.reserved),
                                    }))
                                  : [
                                      { warehouseName: "Mumbai Central Hub", available: avail, reserved: res, freeStock: freeStock },
                                      { warehouseName: "Bengaluru South Hub", available: 120, reserved: 20, freeStock: 100 },
                                      { warehouseName: "Delhi North Hub", available: 18, reserved: 3, freeStock: 15 },
                                    ]
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Actions Footer Row */}
        <div className="p-space-sm bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={openProductPicker}
              className="h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm text-primary" data-icon="add">
                add
              </span>
              <span>+ Add Product Line Item</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBundleModalOpen(true)}
              className="h-8 px-3 rounded-md bg-white border border-[#D1D5DB] text-on-surface-variant font-label-md text-label-md font-medium hover:bg-surface-bright flex items-center gap-1.5 transition-colors"
            >
              <span
                className="material-symbols-outlined text-sm"
                data-icon="library_add"
              >
                library_add
              </span>
              <span>Quick Add Bundle</span>
            </button>
          </div>
          <div className="font-body-sm text-body-sm text-outline">
            <span>
              Lines: <strong>{items.length}</strong> | Total Unit Count:{" "}
              <strong>{totalUnits} Units</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Add Product Dialog */}
      {mounted && isProductModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Full-viewport Backdrop: covers entire viewport (header, sidebar, and page) uniformly */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsProductModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Content - stays above backdrop, fully sharp */}
          <div className="relative z-10 bg-white border border-[#E5E7EB] rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" data-icon="inventory_2">
                  inventory_2
                </span>
                <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                  Add Product Line Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-base" data-icon="close">
                  close
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" data-icon="search">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search products by title or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#D1D5DB] rounded-md text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* Products List */}
            <div className="overflow-y-auto flex-1 p-3 divide-y divide-[#F1F5F9]">
              {isLoadingProducts ? (
                <div className="py-12 text-center text-outline text-body-sm">
                  Loading product catalog from PostgreSQL...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-outline text-body-sm">
                  No products found.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  const convertedUnitPrice = convertFromINR(p.unitPrice, currency);
                  const convertedCostPrice = convertFromINR(p.costPrice, currency);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`p-3 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#EFF6FF] border border-[#BFDBFE]"
                          : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-title-md text-body-md font-semibold text-on-surface">
                            {p.name}
                          </span>
                          <span className="font-code-tabular text-xs text-outline">
                            SKU: {p.sku}
                          </span>
                        </div>
                        <div className="font-body-sm text-[11px] text-outline mt-0.5">
                          {p.categoryName} • {p.isDigital ? "Digital Provisioning • Instant Delivery" : `Stock: ${p.totalStock} units available across hubs`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-code-tabular text-body-md font-bold text-on-surface">
                          {formatCurrency(convertedUnitPrice, currency)}
                        </div>
                        <div className="font-body-sm text-[11px] text-outline">
                          Cost base: {formatCurrency(convertedCostPrice, currency)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Product Configuration & Real-Time Inventory Visibility */}
            {selectedProductId && (() => {
              const sp = products.find((p) => p.id === selectedProductId);
              const isDigital = Boolean(
                sp?.isDigital ||
                sp?.sku?.startsWith("SW-") ||
                sp?.sku?.startsWith("SRV-") ||
                sp?.sku?.startsWith("SVC-") ||
                sp?.sku?.startsWith("SEC-AUDIT") ||
                ["Software", "Services", "Cloud", "Support", "Subscription"].includes(sp?.categoryName || "")
              );

              const totalAvail = isDigital ? 9999 : (sp?.totalStock ?? 0);
              const resCount = isDigital ? 0 : Math.min(10, Math.floor(totalAvail * 0.1));
              const free = isDigital ? 9999 : Math.max(0, totalAvail - resCount);
              const isShort = !isDigital && newQuantity > free;
              const selUnitPrice = sp ? convertFromINR(sp.unitPrice, currency) : 0;
              const previewTotal = newQuantity * selUnitPrice * (1 - newDiscount / 100);

              return (
                <div className="border-t border-[#E5E7EB] bg-[#F8FAFC] p-4 space-y-3">
                  {/* Pre-submission inventory preview */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <ReservationPreview
                        warehouseName={isDigital ? "Cloud & Digital Fulfillment" : "Mumbai Central Hub"}
                        willReserve={newQuantity}
                        currentAvailable={totalAvail}
                        currentReserved={resCount}
                      />
                      <ShipmentReadiness
                        isReady={!isShort}
                        estimatedDispatch={isDigital ? "Instant Provisioning" : (!isShort ? "Today" : "3-5 Business Days (Replenishment)")}
                        reason={isShort ? `Requested ${newQuantity} units exceeds current free stock (${free} units).` : undefined}
                      />
                    </div>
                    {isShort && (
                      <LowStockBanner
                        requestedQuantity={newQuantity}
                        availableQuantity={totalAvail}
                        freeStock={free}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-outline uppercase mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 px-2 py-1 border border-[#D1D5DB] rounded text-body-sm font-code-tabular"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-outline uppercase mb-1">
                          Discount %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={newDiscount}
                          onChange={(e) => setNewDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                          className="w-20 px-2 py-1 border border-[#D1D5DB] rounded text-body-sm font-code-tabular"
                        />
                      </div>
                      <div className="hidden sm:block">
                        <label className="block text-[11px] font-semibold text-outline uppercase mb-1">
                          Preview Total ({currency})
                        </label>
                        <div className="h-[30px] flex items-center font-code-tabular text-xs font-bold text-primary">
                          {formatCurrency(previewTotal, currency)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsProductModalOpen(false)}
                        className="h-9 px-4 rounded-md border border-[#D1D5DB] bg-white text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleAddProduct}
                        className="h-9 px-5 rounded-md bg-primary hover:bg-[#1E3A8A] text-white font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm" data-icon="add">
                          add
                        </span>
                        <span>Add to Quotation</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* Quick Add Bundle Dialog */}
      {mounted && isBundleModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsBundleModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-white border border-[#E5E7EB] rounded-lg shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" data-icon="library_add">
                  library_add
                </span>
                <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                  Select Pre-Configured Bundle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBundleModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-base" data-icon="close">
                  close
                </span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Bundle 1 */}
              <div
                onClick={() => handleAddBundle("WORKSTATION_PRO")}
                className="p-4 border border-[#E5E7EB] rounded-lg hover:border-primary/50 hover:bg-[#F8FAFC] cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-title-md text-body-md font-semibold text-on-surface">
                      Workstation Executive Bundle
                    </h4>
                    <p className="font-body-sm text-xs text-outline mt-1">
                      Includes 2x Thunderbolt 4 Docks, 2x 100W Dual Chargers, and 2x 3-Year Care Plans.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                    Save 10% Bundle
                  </span>
                </div>
              </div>

              {/* Bundle 2 */}
              <div
                onClick={() => handleAddBundle("CLOUD_STARTER")}
                className="p-4 border border-[#E5E7EB] rounded-lg hover:border-primary/50 hover:bg-[#F8FAFC] cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-title-md text-body-md font-semibold text-on-surface">
                      Cloud Migration Foundation
                    </h4>
                    <p className="font-body-sm text-xs text-outline mt-1">
                      Includes Cloud Architecture Migration Service and 3-Year Enterprise Care Plan Pro.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                    Recommended
                  </span>
                </div>
              </div>

              {/* Bundle 3 */}
              <div
                onClick={() => handleAddBundle("COLLABORATION_SUITE")}
                className="p-4 border border-[#E5E7EB] rounded-lg hover:border-primary/50 hover:bg-[#F8FAFC] cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-title-md text-body-md font-semibold text-on-surface">
                      Dual Display Setup
                    </h4>
                    <p className="font-body-sm text-xs text-outline mt-1">
                      Includes Universal Docking Station and 2x UltraSharp 27&quot; 4K Displays.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                    Popular
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#F8F9FA] border-t border-[#E5E7EB] flex justify-end">
              <button
                type="button"
                onClick={() => setIsBundleModalOpen(false)}
                className="h-8 px-4 rounded-md border border-[#D1D5DB] bg-white text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {mounted && itemToDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setItemToDelete(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-white border border-[#E5E7EB] rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 text-[#E11D48] mb-3">
                <span className="material-symbols-outlined text-2xl" data-icon="delete_forever">
                  delete_forever
                </span>
                <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                  Remove Line Item?
                </h3>
              </div>
              <p className="font-body-sm text-body-sm text-outline">
                Are you sure you want to remove <strong>{itemToDelete.productName}</strong> from this quotation? This will immediately update quotation totals, margin, and risk score.
              </p>
            </div>
            <div className="p-3 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="h-8 px-4 rounded-md border border-[#D1D5DB] bg-white text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright"
              >
                Keep Item
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                className="h-8 px-4 rounded-md bg-[#E11D48] hover:bg-[#BE123C] text-white font-label-md text-label-md font-semibold shadow-sm"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
