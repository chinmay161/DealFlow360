import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const KPISkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
      </Card>
    ))}
  </div>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-72" }) => (
  <Card className="p-5 rounded-xl border border-slate-200/80 bg-white space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className={`${height} w-full flex items-center justify-center bg-slate-50/50 rounded-lg`}>
      <div className="space-y-2 w-3/4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  </Card>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <Card className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
    <div className="space-y-2.5">
      <Skeleton className="h-9 w-full rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  </Card>
);

export const WarehouseCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="p-5 rounded-xl border border-slate-200/80 bg-white space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-48" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    ))}
  </div>
);

export const ProductDetailSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3 pt-4">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
    <Skeleton className="h-40 w-full rounded-lg" />
  </div>
);
