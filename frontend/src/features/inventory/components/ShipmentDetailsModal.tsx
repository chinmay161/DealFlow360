import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Truck,
  Building2,
  MapPin,
  Calendar,
  Package,
  ShieldCheck,
} from "lucide-react";
import type { ShipmentRecord } from "../types/inventory.types";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import { ShipmentTimeline } from "./ShipmentTimeline";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ShipmentDetailsModalProps {
  shipment: ShipmentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({
  shipment,
  isOpen,
  onClose,
}) => {
  if (!shipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl max-h-[90vh] flex flex-col">
        {/* Header Strip */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Shipment {shipment.shipmentNumber}</span>
                  <ShipmentStatusBadge status={shipment.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Order: <strong className="text-slate-700 font-mono">{shipment.orderNumber}</strong></span>
                {shipment.quotationNumber && (
                  <>
                    <span>•</span>
                    <Link
                      href={`/quotations/${shipment.quotationNumber}`}
                      className="text-blue-600 font-mono font-bold hover:underline"
                    >
                      {shipment.quotationNumber}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* 3 Metric Summary Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Origin Warehouse</span>
              </div>
              <div className="font-semibold text-slate-900">{shipment.warehouseName}</div>
              <div className="font-mono text-[10px] text-blue-600">{shipment.warehouseCode}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Destination</span>
              </div>
              <div className="font-semibold text-slate-900">{shipment.destination}</div>
              <div className="text-[10px] text-slate-500">{shipment.customerName}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consignment Qty</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700">
                {shipment.reservedQuantity} Units
              </div>
              <div className="text-[10px] text-slate-400">
                {shipment.items?.length || 1} distinct products
              </div>
            </div>
          </div>

          {/* Carrier & Tracking Info */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Logistics Carrier Partner
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {shipment.carrier}
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Tracking Number
              </span>
              <span className="font-mono font-bold text-xs text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                {shipment.trackingCode || "TRK-EXP-482109"}
              </span>
            </div>
          </div>

          {/* Products Table */}
          {shipment.items && shipment.items.length > 0 && (
            <div className="border border-slate-200/80 rounded-xl overflow-hidden">
              <div className="p-2.5 bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Consigned Package Manifest
              </div>
              <div className="divide-y divide-slate-100">
                {shipment.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                    <div>
                      <div className="font-semibold text-slate-900">{it.productName}</div>
                      <div className="font-mono text-[10px] text-slate-400">SKU: {it.sku}</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      {it.quantity} units
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Delivery Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-slate-700">Estimated Delivery:</span>
            </div>
            <span className="font-mono font-bold text-slate-900">
              {shipment.estimatedDelivery || "Tomorrow by 4:00 PM"}
            </span>
          </div>

          {/* Vertical Fulfillment Timeline */}
          <ShipmentTimeline
            steps={shipment.verticalTimeline}
            currentStatus={shipment.status}
            shipmentNumber={shipment.shipmentNumber}
            quotationNumber={shipment.quotationNumber}
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Read-only tracking telemetry</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            {shipment.quotationNumber && (
              <Link href={`/quotations/${shipment.quotationNumber}`}>
                <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
                  Open Quotation
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
