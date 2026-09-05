import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No records found",
  description = "There are currently no items to display matching your criteria.",
  icon,
  action,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 text-center bg-white border border-[#E5E7EB] rounded-lg shadow-sm">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      <p className="text-xs text-outline mt-1 max-w-sm">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-3 py-1.5 rounded-md bg-primary hover:bg-[#1E3A8A] text-on-primary text-xs font-medium transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
