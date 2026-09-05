import React from "react";
import { Card } from "@/components/ui/card";
import { Truck, MapPin, Building2, Package, Calendar, ArrowRight, FileText } from "lucide-react";
import type { ShipmentRecord } from "../types/inventory.types";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import Link from "next/link";

interface ShipmentCardProps {
  shipment: ShipmentRecord;
  onViewDetails?: (shipment: ShipmentRecord) => void;
  className?: string;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({
  shipment,
  onViewDetails,
  className = "",
}) => {
  const expectedDelivery = shipment.estimatedDelivery || "Tomorrow by 4:00 PM";

  return (
    <Card
      className={`p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-3.5 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900">
                {shipment.shipmentNumber}
              </span>
              <ShipmentStatusBadge status={shipment.status} />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Carrier: <strong className="text-slate-700">{shipment.carrier}</strong></span>
              {shipment.trackingCode && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-blue-600">
                    {shipment.trackingCode}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {shipment.quotationNumber && (
          <Link
            href={`/quotations/${shipment.quotationNumber}`}
            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-700 hover:underline bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100"
          >
            <FileText className="w-3 h-3" />
            <span>{shipment.quotationNumber}</span>
          </Link>
        )}
      </div>

      {/* Shipment Details 3-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs">
        {/* Origin Warehouse */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span>Warehouse</span>
          </div>
          <div className="font-semibold text-slate-800 line-clamp-1">
            {shipment.warehouseName}
          </div>
          <div className="font-mono text-[10px] text-blue-700">
            {shipment.warehouseCode}
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span>Destination</span>
          </div>
          <div className="font-medium text-slate-800 line-clamp-1">
            {shipment.destination}
          </div>
          <div className="text-[10px] text-slate-400">Regional Consignee</div>
        </div>

        {/* Reserved Quantity */}
        <div className="space-y-0.5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400">
            <Package className="w-3 h-3 text-emerald-600" />
            <span>Reserved Quantity</span>
          </div>
          <div className="font-mono font-bold text-sm text-emerald-700">
            {shipment.reservedQuantity.toLocaleString()} Units
          </div>
          <div className="text-[10px] text-slate-400">Total In Shipment</div>
        </div>
      </div>

      {/* Products Allocation Pills */}
      {shipment.items && shipment.items.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1">Products:</span>
          {shipment.items.map((item, idx) => (
            <span
              key={idx}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
            >
              {item.sku}: {item.quantity}x
            </span>
          ))}
        </div>
      )}

      {/* Footer: Expected Delivery & Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Expected Delivery: <strong className="text-slate-800 font-medium">{expectedDelivery}</strong></span>
        </div>

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(shipment)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
          >
            <span>Timeline</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </Card>
  );
};
