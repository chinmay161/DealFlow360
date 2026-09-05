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

  useEffect(() => {
    if (!quotationId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/governance/counterfactuals?quotationId=${quotationId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted) setRecommendations(data);
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
    try {
      await updateLineItemAction({
        lineItemId: item.lineItemId,
        discountPercent: item.targetDiscount,
      });
      setSuccessMessage(`Applied discount adjustment to ${item.productName}! Deal margin improved.`);
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
          What-if scenarios for policy compliance
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

      <div className="space-y-2.5">
        {recommendations.map((rec) => {
          const isApplying = applyingId === rec.id;

          return (
            <div
              key={rec.id}
              className="bg-white/90 border border-emerald-100 rounded-lg p-3 flex items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-xs font-bold text-on-surface">
                    {rec.productName}
                  </span>
                  <span className="text-[11px] text-outline font-code-tabular">
                    {rec.currentDiscount}% &rarr;{" "}
                    <strong className="text-emerald-700">{rec.targetDiscount}% discount</strong>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    +{rec.marginImprovement}% Margin Boost
                  </span>
                </div>
                <p className="text-body-sm text-[11px] text-on-surface-variant mt-1">
                  {rec.rationale}
                </p>
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
          );
        })}
      </div>
    </div>
  );
};
