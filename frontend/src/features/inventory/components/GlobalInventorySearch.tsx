import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GlobalInventorySearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

export const GlobalInventorySearch: React.FC<GlobalInventorySearchProps> = ({
  onSearch,
  className = "",
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 absolute left-3 text-slate-400" />
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Global Search: SKU, Product, Warehouse, Reservation, Shipment..."
        className="pl-9 pr-20 h-9 text-xs rounded-lg border-slate-200 bg-white shadow-xs focus:ring-2 focus:ring-blue-600/20"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-14 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <Button
        type="submit"
        size="sm"
        className="absolute right-1 h-7 px-2 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md"
      >
        Search
      </Button>
    </form>
  );
};
