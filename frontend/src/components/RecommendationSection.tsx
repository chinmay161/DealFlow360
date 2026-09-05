"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRecommendationsForQuoteAction } from "@/lib/actions/lookupActions";
import { addLineItemAction } from "@/lib/actions/quoteActions";

interface RecommendationItem {
  id: string;
  sourceSku: string;
  targetSku: string;
  targetProductId: string;
  title: string;
  type: string;
  confidenceScore: number;
  marginGain: number;
  unitPrice: number;
  description: string;
}

interface RecommendationSectionProps {
  quotationId?: string;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  quotationId,
}) => {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecs() {
      if (!quotationId) return;
      setLoading(true);
      try {
        const data = await getRecommendationsForQuoteAction(quotationId);
        setRecommendations(data);
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecs();
  }, [quotationId]);

  const handleAddToQuote = async (rec: RecommendationItem) => {
    if (!quotationId) return;
    setAddingId(rec.id);
    try {
      await addLineItemAction({
        quotationId,
        productId: rec.targetProductId,
        quantity: 1,
        discountPercent: 0,
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to add recommendation to quote:", err);
      router.refresh();
    } finally {
      setAddingId(null);
    }
  };

  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-space-sm pt-space-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm" data-icon="auto_awesome">
            auto_awesome
          </span>
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">
            Recommended for this Deal
          </h2>
          <span className="text-label-sm font-label-sm text-outline">
            AI-Driven Cross-Sell Suggestions
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-secondary">
          Catalog Engine ({recommendations.length} available)
        </span>
      </div>

      <div className="grid grid-cols-3 gap-space-base">
        {recommendations.map((rec) => {
          const isAdding = addingId === rec.id;
          return (
            <div
              key={rec.id}
              className="p-space-base bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_1px_2px_rgba(15,23,42,0.04)] hover:border-secondary/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-title-md text-body-md font-semibold text-on-surface leading-tight">
                      {rec.title}
                    </h3>
                    <span className="font-body-sm text-[11px] text-outline">
                      SKU: {rec.targetSku}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-label-sm font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
                    +${rec.marginGain} margin
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                  {rec.description}
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="font-code-tabular text-body-md font-bold text-on-surface tnum">
                  ${rec.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  <span className="text-outline text-xs font-normal"> / unit</span>
                </div>
                <button
                  type="button"
                  disabled={isAdding}
                  onClick={() => handleAddToQuote(rec)}
                  className="h-7 px-3 rounded bg-surface-container-low hover:bg-surface-container-high text-primary text-label-md font-label-md font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-xs" data-icon="add">
                    add
                  </span>
                  <span>{isAdding ? "Adding..." : "Add to Quote"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
