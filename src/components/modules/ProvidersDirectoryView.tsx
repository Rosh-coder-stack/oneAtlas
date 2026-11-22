"use client";

import * as React from "react";
import Link from "next/link";
import { ApiProviderItem } from "@/types";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type FilterMode = "all" | "verified" | "open-weights" | "proprietary";
type SortOption = "models-desc" | "alpha-asc" | "alpha-desc";

export function ProvidersDirectoryView() {
  const [providers, setProviders] = React.useState<ApiProviderItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<FilterMode>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("models-desc");
  const [reloadKey, setReloadKey] = React.useState(0);

  // Fetch providers from /api/providers
  React.useEffect(() => {
    let isCancelled = false;

    async function loadProviders() {
      try {
        const res = await fetch("/api/providers");
        const json = await res.json();

        if (isCancelled) return;

        if (!res.ok || !json.success || !Array.isArray(json.data)) {
          setError(json?.error?.message || `Failed to retrieve provider directory (HTTP ${res.status}).`);
          setProviders([]);
        } else {
          setProviders(json.data);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("[OneAtlas] Failed to load providers:", err);
          setError(err instanceof Error ? err.message : "Network error loading providers.");
          setProviders([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProviders();

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  // Filter and sort providers
  const filteredProviders = React.useMemo(() => {
    let list = [...providers];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Filter mode
    if (filterMode === "verified") {
      list = list.filter((p) => p.isVerified);
    } else if (filterMode === "open-weights") {
      list = list.filter((p) => (p.openWeightsCount || 0) > 0);
    } else if (filterMode === "proprietary") {
      list = list.filter((p) => (p.proprietaryCount || 0) > 0);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "models-desc") {
        return b.modelsCount - a.modelsCount || a.name.localeCompare(b.name);
      }
      if (sortBy === "alpha-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "alpha-desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return list;
  }, [providers, searchQuery, filterMode, sortBy]);

  // Aggregate directory statistics
  const totalModelsCount = React.useMemo(() => {
    return providers.reduce((sum, p) => sum + (p.modelsCount || 0), 0);
  }, [providers]);

  const verifiedLabsCount = React.useMemo(() => {
    return providers.filter((p) => p.isVerified).length;
  }, [providers]);

  // Visual avatar color utility based on provider slug
  const getProviderBrandGradient = (slug: string) => {
    switch (slug) {
      case "openai":
        return "from-emerald-500/20 to-teal-900/30 text-emerald-400 border-emerald-500/40";
      case "anthropic":
        return "from-amber-500/20 to-orange-900/30 text-amber-400 border-amber-500/40";
      case "google":
        return "from-blue-500/20 to-indigo-900/30 text-blue-400 border-blue-500/40";
      case "meta-ai":
        return "from-sky-500/20 to-cyan-900/30 text-sky-400 border-sky-500/40";
      case "deepseek":
        return "from-indigo-500/20 to-purple-900/30 text-indigo-400 border-indigo-500/40";
      case "mistral-ai":
        return "from-orange-500/20 to-rose-900/30 text-orange-400 border-orange-500/40";
      default:
        return "from-slate-700/20 to-slate-900/30 text-slate-300 border-slate-700/40";
    }
  };

  if (isLoading) {
    return <ProvidersDirectorySkeleton />;
  }

  if (error) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-4">
        <div className="p-5 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 space-y-2">
          <div className="flex items-center justify-center gap-2 font-semibold">
            <Icons.AlertCircle className="h-5 w-5 text-red-400" />
            <span>Failed to Load AI Provider Directory</span>
          </div>
          <p className="text-xs text-red-200/80">{error}</p>
        </div>
        <Button variant="primary" onClick={handleRetry} className="mx-auto">
          Retry Request
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner & Directory Stats */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm" className="gap-1 font-mono text-[10px]">
                <Icons.Building className="h-3 w-3 text-sky-400" />
                Frontier AI Labs
              </Badge>
              <Badge variant="outline" size="sm" className="text-slate-400 font-mono text-[10px]">
                Live PostgreSQL Registry
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              AI Provider & Research Lab Directory
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore foundation model creators, frontier neural architecture labs, and open-source contributors shaping the global intelligence layer.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 text-center">
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                {providers.length}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                Frontier Labs
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 text-center">
              <div className="text-2xl font-black font-mono text-sky-400 tracking-tight">
                {totalModelsCount}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                Total Models
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 text-center">
              <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                {verifiedLabsCount}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                Verified Audits
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter & Sort Controls */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Icons.Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI providers, research labs, or architectures..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <Icons.Close className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-slate-800 bg-slate-950/80">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === "all"
                  ? "bg-sky-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({providers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("verified")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === "verified"
                  ? "bg-sky-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Verified Labs
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("open-weights")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === "open-weights"
                  ? "bg-sky-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Open Weights
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("proprietary")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === "proprietary"
                  ? "bg-sky-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Proprietary
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="py-1 px-2 text-xs rounded-md border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="models-desc">Most Models First</option>
              <option value="alpha-asc">Alphabetical (A - Z)</option>
              <option value="alpha-desc">Alphabetical (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Provider Cards Grid */}
      {filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProviders.map((provider) => {
            const brandClass = getProviderBrandGradient(provider.slug);

            return (
              <div
                key={provider.id || provider.slug}
                className="p-5 sm:p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 group relative"
              >
                <div className="space-y-4">
                  {/* Top Bar: Lab Avatar & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-xl bg-gradient-to-br ${brandClass} border font-black font-mono text-base flex items-center justify-center shadow-inner`}
                      >
                        {provider.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/providers/${provider.slug}`}
                            className="font-bold text-white text-base hover:text-sky-400 transition-colors tracking-tight"
                          >
                            {provider.name}
                          </Link>
                          {provider.isVerified && (
                            <Icons.CheckCircle className="h-4 w-4 text-sky-400" />
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          /{provider.slug}
                        </span>
                      </div>
                    </div>

                    <Badge variant="outline" size="sm" className="font-mono text-xs">
                      {provider.modelsCount} {provider.modelsCount === 1 ? "Model" : "Models"}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {provider.description || "Frontier research organization engineering advanced neural network systems."}
                  </p>

                  {/* Model Distribution Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(provider.openWeightsCount || 0) > 0 && (
                      <Badge variant="success" size="sm" className="text-[10px]">
                        {provider.openWeightsCount} Open Weights
                      </Badge>
                    )}
                    {(provider.proprietaryCount || 0) > 0 && (
                      <Badge variant="purple" size="sm" className="text-[10px]">
                        {provider.proprietaryCount} Proprietary
                      </Badge>
                    )}
                  </div>

                  {/* Sample Models */}
                  {provider.sampleModels && provider.sampleModels.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                        Featured Architecture Models
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.sampleModels.map((sm) => (
                          <Link
                            key={sm.slug}
                            href={`/models/${sm.slug}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-800 bg-slate-950/80 text-slate-300 hover:text-sky-300 hover:border-sky-800 transition-colors"
                          >
                            <span>{sm.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {provider.websiteUrl && (
                      <a
                        href={provider.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        title={`${provider.name} official website`}
                      >
                        <Icons.Globe className="h-3 w-3 text-sky-400" />
                        <span>Website</span>
                        <Icons.ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/?provider=${encodeURIComponent(provider.slug)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                      title={`Filter Discovery Catalog by ${provider.name}`}
                    >
                      <Icons.Filter className="h-3 w-3 text-slate-400" />
                      <span>Catalog</span>
                    </Link>

                    <Link
                      href={`/providers/${provider.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all"
                    >
                      <span>Lab Dossier</span>
                      <Icons.ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="h-12 w-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Icons.Building className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Matching Providers</h3>
            <p className="text-xs text-slate-400">
              No AI providers match your query &quot;{searchQuery}&quot;. Try adjusting your keywords or clearing active filters.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterMode("all");
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Loading Skeleton state for Providers Directory
 */
function ProvidersDirectorySkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="h-10 w-96 bg-slate-800 rounded-lg" />
        <div className="h-4 w-full max-w-xl bg-slate-800/60 rounded" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-14 rounded-xl border border-slate-800 bg-slate-900/40" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-10 w-10 bg-slate-800 rounded-xl" />
              <div className="h-6 w-20 bg-slate-800 rounded" />
            </div>
            <div className="h-6 w-36 bg-slate-800 rounded" />
            <div className="h-12 w-full bg-slate-800/50 rounded" />
            <div className="h-8 w-full bg-slate-800/40 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
