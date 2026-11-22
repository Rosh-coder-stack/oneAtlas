"use client";

import * as React from "react";
import { Icons } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { ApiCategoryItem, ApiProviderItem } from "@/types";

export interface FilterState {
  search: string;
  category: string;
  provider: string;
  license: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface ModelFiltersProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  categories: ApiCategoryItem[];
  providers: ApiProviderItem[];
  resultsCount: number;
  isLoading?: boolean;
}

export function ModelFilters({
  filters,
  onFilterChange,
  onReset,
  categories,
  providers,
  resultsCount,
  isLoading,
}: ModelFiltersProps) {
  // Local search query for instant responsiveness while debouncing
  const [localSearch, setLocalSearch] = React.useState(filters.search);

  // Synchronize local search state when filters.search changes externally (e.g. from reset or global navbar)
  const [prevSearchProp, setPrevSearchProp] = React.useState(filters.search);
  if (filters.search !== prevSearchProp) {
    setPrevSearchProp(filters.search);
    setLocalSearch(filters.search);
  }

  // Debounce search by 300ms
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== filters.search) {
        console.log("[OneAtlas ModelFilters] Debounced search dispatched:", localSearch);
        onFilterChange({ search: localSearch });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, filters.search, onFilterChange]);

  const handleClearSearch = () => {
    console.log("[OneAtlas ModelFilters] Clearing search");
    setLocalSearch("");
    onFilterChange({ search: "" });
  };

  const handleResetAll = () => {
    console.log("[OneAtlas ModelFilters] Resetting all filters");
    setLocalSearch("");
    onReset();
  };

  const sortOptions = [
    { label: "Newest Releases", sortBy: "release_date", sortOrder: "desc" },
    { label: "Input Price: Low to High", sortBy: "input_price", sortOrder: "asc" },
    { label: "Input Price: High to Low", sortBy: "input_price", sortOrder: "desc" },
    { label: "Output Price: Low to High", sortBy: "output_price", sortOrder: "asc" },
    { label: "Output Price: High to Low", sortBy: "output_price", sortOrder: "desc" },
    { label: "Context Window: Largest", sortBy: "context_window", sortOrder: "desc" },
    { label: "Name: A to Z", sortBy: "name", sortOrder: "asc" },
  ];

  const currentSortKey = `${filters.sortBy}:${filters.sortOrder}`;

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.category) ||
    Boolean(filters.provider) ||
    Boolean(filters.license);

  return (
    <div className="space-y-4 rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 sm:p-5 backdrop-blur-sm shadow-sm">
      {/* Row 1: Search Bar & Sort Dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            {isLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin inline-block" />
            ) : (
              <Icons.Search className="h-4 w-4" />
            )}
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              const val = e.target.value;
              console.log("[OneAtlas ModelFilters] Search keystroke:", val);
              setLocalSearch(val);
            }}
            placeholder="Search models by name, architecture, specs, or tagline..."
            className="w-full pl-10 pr-9 py-2 text-sm rounded-lg border border-slate-800 bg-slate-950/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <Icons.Close className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
          <label htmlFor="sortBySelect" className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline-block">
            Sort by:
          </label>
          <div className="relative w-full md:w-60">
            <select
              id="sortBySelect"
              value={currentSortKey}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(":");
                onFilterChange({
                  sortBy,
                  sortOrder: sortOrder as "asc" | "desc",
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950/90 text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={`${opt.sortBy}:${opt.sortOrder}`} value={`${opt.sortBy}:${opt.sortOrder}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Row 2: Provider, Category & License Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Dropdown / Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Icons.Filter className="h-3 w-3" />
              Category:
            </span>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-800 bg-slate-950/90 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name} {c.modelsCount ? `(${c.modelsCount})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Filter Dropdown */}
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="text-xs text-slate-400">Lab:</span>
            <select
              value={filters.provider}
              onChange={(e) => onFilterChange({ provider: e.target.value })}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-800 bg-slate-950/90 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name} {p.modelsCount ? `(${p.modelsCount})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* License Filter Pills */}
          <div className="flex items-center gap-1 ml-0 sm:ml-2">
            <span className="text-xs text-slate-400 mr-0.5">License:</span>
            {[
              { label: "All", value: "" },
              { label: "Open Weights", value: "open-weights" },
              { label: "Proprietary", value: "proprietary" },
            ].map((lic) => (
              <button
                key={lic.value}
                type="button"
                onClick={() => onFilterChange({ license: lic.value })}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filters.license === lic.value
                    ? "bg-slate-700 text-white border border-slate-600 font-medium"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700"
                }`}
              >
                {lic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Metadata & Reset Action */}
        <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto">
          <span className="font-mono">
            {isLoading ? (
              <span className="text-sky-400 animate-pulse">Syncing...</span>
            ) : (
              <>
                Total: <strong className="text-white font-semibold">{resultsCount}</strong>
              </>
            )}
          </span>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetAll}
              className="text-xs text-sky-400 hover:text-sky-300 py-1 px-2 h-auto"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
