import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProductAvailability } from "../services/inventory.service";
import { ProductAvailabilityCard } from "./ProductAvailabilityCard";
import { ProductDetailSkeleton } from "./LoadingSkeleton";

interface ProductDetailModalProps {
  productId: string | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  onClose,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory", "product-detail", productId],
    queryFn: () => (productId ? fetchProductAvailability(productId) : null),
    enabled: Boolean(productId),
  });

  if (!productId) return null;

  return (
    <Dialog open={Boolean(productId)} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-2xl border border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {data?.product?.name || "Product Stock Details"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-mono text-blue-700 font-bold">{data?.product?.sku}</span>
                <span>•</span>
                <span>{data?.product?.category}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading || !data ? (
          <ProductDetailSkeleton />
        ) : (
          <div className="pt-2">
            <ProductAvailabilityCard
              product={data.product}
              warehouses={data.warehouses}
              reservations={data.reservations}
              shipments={data.shipments}
            />
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 text-right">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
