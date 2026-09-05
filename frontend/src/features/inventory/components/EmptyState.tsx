import React from "react";
import { PackageOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Inventory Items Found",
  description = "No matching records found for the applied search and filter criteria.",
  icon: Icon = PackageOpen,
  actionText = "Reset Filters",
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 my-4 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
        {description}
      </p>
      {onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="text-xs font-semibold gap-1.5 border-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>{actionText}</span>
        </Button>
      )}
    </div>
  );
};
