"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateLineItemAction } from "@/lib/actions/quoteActions";

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
}

interface CounterfactualCardProps {
  quotationId: string;
}

export const CounterfactualCard: React.FC<CounterfactualCardProps> = ({ quotationId }) => {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<CounterfactualItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [simulatedValues, setSimulatedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!quotationId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/governance/counterfactuals?quotationId=${quotationId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted) {
          setRecommendations(data);
          const initialSim: Record<string, number> = {};
          data.forEach((item: CounterfactualItem) => {
            initialSim[item.id] = item.targetDiscount;
          });
          setSimulatedValues(initialSim);
        }
      })
      .catch(() => {
        if (isMounted) setRecommendations([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [quotationId]);

  const handleApply = async (item: CounterfactualItem) => {
    if (!item.lineItemId) return;
    setApplyingId(item.id);
    const chosenDiscount = simulatedValues[item.id] ?? item.targetDiscount;
    try {
      await updateLineItemAction({
        lineItemId: item.lineItemId,
        discountPercent: chosenDiscount,
      });
      setSuccessMessage(`Applied discount adjustment (${chosenDiscount}%) to ${item.productName}! Deal margin improved.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      router.refresh();
    } catch (err) {
      console.error("Failed to apply counterfactual:", err);
    } finally {
      setApplyingId(null);
    }
  };

  if (!loading && recommendations.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/50 border border-emerald-200/80 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-lg" data-icon="troubleshoot">
            troubleshoot
          </span>
          <h3 className="font-title-md text-xs font-bold text-on-surface">
            Counterfactual Margin Optimization Engine
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Active Simulations
          </span>
        </div>
        <span className="text-[11px] text-outline">
          Interactive what-if simulations for margin compliance
        </span>
      </div>

      {successMessage && (
        <div className="mb-3 p-2 bg-emerald-100/80 border border-emerald-300 rounded text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm" data-icon="check_circle">
            check_circle
          </span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const isApplying = applyingId === rec.id;
          const currentSimValue = simulatedValues[rec.id] ?? rec.targetDiscount;
          const simMarginBoost = Math.max(
            0,
            (rec.currentDiscount - currentSimValue) * 0.85
          ).toFixed(1);

          return (
            <div
              key={rec.id}
              className="bg-white/90 border border-emerald-100 rounded-lg p-3.5 space-y-2 shadow-xs hover:border-emerald-200 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-xs font-bold text-on-surface">
                    {rec.productName}
                  </span>
                  <span className="text-[11px] text-outline font-code-tabular">
                    Current: <strong>{rec.currentDiscount}%</strong> &rarr; Simulated:{" "}
                    <strong className="text-emerald-700">{currentSimValue}%</strong>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    +{simMarginBoost}% Margin Boost
                  </span>
                </div>

                {rec.lineItemId && (
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={() => handleApply(rec)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-xs font-semibold shrink-0 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm" data-icon="auto_fix_high">
                      auto_fix_high
                    </span>
                    <span>{isApplying ? "Optimizing..." : "Apply Suggestion"}</span>
                  </button>
                )}
              </div>

              <p className="text-body-sm text-[11px] text-on-surface-variant">
                {rec.rationale}
              </p>

              {/* Interactive What-If Slider */}
              <div className="pt-2 border-t border-emerald-50 flex items-center gap-3">
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider whitespace-nowrap">
                  What-If Discount:
                </span>
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
                  className="w-48 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {currentSimValue}%
                </span>
                <span className="text-[11px] text-outline">
                  (Simulated Boost: +{simMarginBoost}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
