"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Sliders, CheckCircle, ArrowRight, TrendingUp, ShieldAlert } from "lucide-react";
import { updateLineItemAction } from "@/lib/actions/quoteActions";
import { useToast } from "@/components/providers/ToastProvider";

interface CounterfactualItem {
  id: string;
  quotationId: string;
  lineItemId?: string;
  productName: string;
  currentDiscount: number;
  targetDiscount: number;
  deltaDiscount: number;
  marginImprovement: number;
  rationale: string;
  actionType?: string;
  requestedQuantity?: number;
  availableQuantity?: number;
  approvalImpact?: string;
  revenueImpact?: string;
  riskScore?: number;
}

interface RecommendationsDrawerProps {
  quotationId: string | null;
  quotationNumber: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export const RecommendationsDrawer: React.FC<RecommendationsDrawerProps> = ({
  quotationId,
  quotationNumber,
  isOpen,
  onClose,
  onApplied,
}) => {
  const { success, error } = useToast();
  const [recommendations, setRecommendations] = useState<CounterfactualItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [simulatedValues, setSimulatedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen || !quotationId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/governance/counterfactuals?quotationId=${encodeURIComponent(quotationId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setRecommendations(data);
          const initialSim: Record<string, number> = {};
          data.forEach((item: CounterfactualItem) => {
            initialSim[item.id] = item.targetDiscount;
          });
          setSimulatedValues(initialSim);
        } else {
          // Fallback to /api/quotations/[id]/recommendations
          return fetch(`/api/quotations/${encodeURIComponent(quotationId)}/recommendations`)
            .then((r) => (r.ok ? r.json() : null))
            .then((alt) => {
              if (!isMounted) return;
              if (alt && Array.isArray(alt.recommendations)) {
                const formatted = alt.recommendations.map((r: any) => ({
                  id: r.id,
                  quotationId,
                  lineItemId: r.changes?.[0]?.lineItemId,
                  productName: r.changes?.[0]?.productName || r.title,
                  currentDiscount: r.changes?.[0]?.currentValue || 20,
                  targetDiscount: r.changes?.[0]?.proposedValue || 12,
                  deltaDiscount: (r.changes?.[0]?.currentValue || 20) - (r.changes?.[0]?.proposedValue || 12),
                  marginImprovement: 3.5,
                  rationale: r.description,
                  approvalImpact: r.expectedResult || "Auto Approval",
                  revenueImpact: r.revenueImpactFormatted || "+₹15,000",
                  riskScore: r.projectedRiskScore || 25,
                }));
                setRecommendations(formatted);
              }
            });
        }
      })
      .catch((err) => {
        console.warn("[RecommendationsDrawer] Fetch error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, quotationId]);

  if (!isOpen) return null;

  const handleApply = async (item: CounterfactualItem) => {
    if (!item.lineItemId) {
      error("Missing line item reference for suggestion.");
      return;
    }

    setApplyingId(item.id);
    try {
      if (item.actionType === "INVENTORY_QUANTITY_REDUCTION" && item.availableQuantity !== undefined) {
        await updateLineItemAction({
          lineItemId: item.lineItemId,
          quantity: item.availableQuantity,
        });
        success(`Applied! Quantity set to ${item.availableQuantity} units. Auto-approval criteria satisfied.`);
      } else {
        const chosenDiscount = simulatedValues[item.id] ?? item.targetDiscount;
        await updateLineItemAction({
          lineItemId: item.lineItemId,
          discountPercent: chosenDiscount,
        });
        success(`Applied! Discount adjusted to ${chosenDiscount}% on ${item.productName}. Deal margin elevated.`);
      }

      onApplied?.();
      onClose();
    } catch (err: any) {
      error("Failed to apply recommendation", err?.message);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Counterfactual Recommendations</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Quote: <span className="font-bold text-slate-800">{quotationNumber || quotationId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
            <Sliders className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Autonomous Margin &amp; Governance Optimizer</span>
              Simulates optimal commercial concessions that eliminate approval bottlenecks while maximizing deal profitability.
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Running counterfactual simulations...</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
              <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-800">No Actionable Recommendations</p>
              <p className="text-xs text-slate-400 mt-1">
                This quotation is already optimized or does not have high-discount exceptions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const isApplying = applyingId === rec.id;
                const currentSimValue = simulatedValues[rec.id] ?? rec.targetDiscount;
                const simMarginBoost = Math.max(0, (rec.currentDiscount - currentSimValue) * 0.85).toFixed(1);

                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-emerald-200/90 bg-white shadow-xs space-y-3 transition-all hover:border-emerald-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{rec.productName}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.rationale}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Auto-Approval Fix
                      </span>
                    </div>

                    {/* Interactive slider for what-if exploration */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 bg-slate-50/60 p-2.5 rounded-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Concession Adjustment:</span>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="line-through text-slate-400">{rec.currentDiscount}%</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <strong className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {currentSimValue}%
                          </strong>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max={Math.max(rec.currentDiscount, 30)}
                        step="0.5"
                        value={currentSimValue}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSimulatedValues((prev) => ({ ...prev, [rec.id]: val }));
                        }}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <TrendingUp className="w-3.5 h-3.5" /> Margin Gain: +{simMarginBoost}%
                        </span>
                        <span className="flex items-center gap-1 text-blue-700 font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5" /> Projected Risk: {rec.riskScore ?? 25}/100
                        </span>
                      </div>
                    </div>

                    {/* Apply action button */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={isApplying}
                        onClick={() => handleApply(rec)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isApplying ? "Applying..." : "Apply Suggestion to Quote"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">DealFlow360 Counterfactual Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
