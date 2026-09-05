import React from "react";
import { Building2, Bookmark, Truck } from "lucide-react";
import { InventoryStatusBadge } from "./InventoryStatusBadge";

interface ProductAvailabilityCardProps {
  product: {
    id: string;
    sku: string;
    name: string;
    description?: string | null;
    category: string;
    unitPrice: number;
    totalOnHand: number;
    totalAvailable: number;
    totalReserved: number;
    freeStock: number;
  };
  warehouses: {
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    location: string;
    onHand: number;
    available: number;
    reserved: number;
    freeStock: number;
    status: any;
  }[];
  reservations?: {
    id: string;
    quotationNumber: string;
    customerName: string;
    warehouseCode: string;
    quantity: number;
    status: string;
  }[];
  shipments?: {
    id: string;
    shipmentNumber: string;
    orderNumber: string;
    customerName: string;
    warehouseCode: string;
    status: string;
    quantity: number;
  }[];
}

export const ProductAvailabilityCard: React.FC<ProductAvailabilityCardProps> = ({
  product,
  warehouses,
  reservations = [],
  shipments = [],
}) => {
  return (
    <div className="space-y-4">
      {/* Overview Top Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Stored</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {product.totalOnHand.toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
          <span className="text-[11px] text-emerald-700 font-semibold uppercase">Available Stock</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-0.5">
            {product.totalAvailable.toLocaleString()} <span className="text-xs text-emerald-600 font-normal">units</span>
          </div>
        </div>

        <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl">
          <span className="text-[11px] text-blue-700 font-semibold uppercase">Committed (Reserved)</span>
          <div className="text-xl font-bold font-mono text-blue-800 mt-0.5">
            {product.totalReserved.toLocaleString()} <span className="text-xs text-blue-600 font-normal">units</span>
          </div>
        </div>

        <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl">
          <span className="text-[11px] text-indigo-700 font-semibold uppercase">Free Fulfillable</span>
          <div className="text-xl font-bold font-mono text-indigo-800 mt-0.5">
            {product.freeStock.toLocaleString()} <span className="text-xs text-indigo-600 font-normal">units</span>
          </div>
        </div>
      </div>

      {/* Multi-Warehouse Distribution Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900">Regional Warehouse Distribution</h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Pan-India Warehouses</span>
        </div>

        <div className="divide-y divide-slate-100">
          {warehouses.map((wh) => (
            <div key={wh.warehouseId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{wh.warehouseName}</span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {wh.warehouseCode}
                  </span>
                  <InventoryStatusBadge status={wh.status} />
                </div>
                <div className="text-[11px] text-slate-500">{wh.location}</div>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Available</span>
                  <span className="font-mono font-bold text-slate-800">{wh.available}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Reserved</span>
                  <span className="font-mono font-bold text-blue-700">{wh.reserved}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Free Stock</span>
                  <span className="font-mono font-bold text-emerald-700">{wh.freeStock}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Reservations & Shipment Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Active Reservations */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Bookmark className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Quote Allocations</span>
          </div>

          {reservations.length === 0 ? (
            <div className="text-[11px] text-slate-400 py-3 text-center">No active reservations for this product.</div>
          ) : (
            <div className="space-y-2">
              {reservations.map((r) => (
                <div key={r.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-blue-700 font-mono">{r.quotationNumber}</span>
                    <div className="text-[10px] text-slate-500">{r.customerName}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-slate-800">{r.quantity} units</span>
                    <div className="text-[10px] text-slate-400 font-mono">{r.warehouseCode}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consignment Status */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Active Shipments</span>
          </div>

          {shipments.length === 0 ? (
            <div className="text-[11px] text-slate-400 py-3 text-center">No active consignments for this product.</div>
          ) : (
            <div className="space-y-2">
              {shipments.map((s) => (
                <div key={s.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 font-mono">{s.shipmentNumber}</span>
                    <div className="text-[10px] text-slate-500">{s.customerName}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-slate-800">{s.quantity} units</span>
                    <div className="text-[10px] text-blue-600 font-semibold">{s.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
