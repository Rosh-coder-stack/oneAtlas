"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProviderDetailItem, ModelDetailItem } from "@/types";
import { useComparison } from "@/context/ComparisonContext";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatTokenCount,
  formatPrice,
  parseParameterTopology,
} from "@/lib/utils";

interface ProviderDetailViewProps {
  slug: string;
}

type ModelSortOption = "name-asc" | "date-desc" | "input-price-asc" | "output-price-asc" | "context-desc";
type LicenseFilter = "all" | "open-weights" | "proprietary";

export function ProviderDetailView({ slug }: ProviderDetailViewProps) {
  const router = useRouter();
  const { isModelSelected, toggleModel } = useComparison();

  const [provider, setProvider] = React.useState<ProviderDetailItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<{ code?: string; message: string } | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Search, Filter & Sort state for associated models
  const [modelSearch, setModelSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [licenseFilter, setLicenseFilter] = React.useState<LicenseFilter>("all");
  const [sortBy, setSortBy] = React.useState<ModelSortOption>("name-asc");

  // Fetch provider details from GET /api/providers/[slug]
  React.useEffect(() => {
    let isCancelled = false;

    async function executeFetch() {
      try {
        const res = await fetch(`/api/providers/${encodeURIComponent(slug)}`);
        const json = await res.json();

        if (isCancelled) return;

        if (!res.ok || !json.success) {
          if (res.status === 404 || json.error?.code === "PROVIDER_NOT_FOUND") {
            setError({
              code: "PROVIDER_NOT_FOUND",
              message: json.error?.message || `AI Provider with slug '${slug}' was not found in the registry.`,
            });
          } else {
            setError({
              code: json.error?.code || "FETCH_ERROR",
              message: json.error?.message || `Failed to retrieve provider details for '${slug}' (HTTP ${res.status}).`,
            });
          }
          setProvider(null);
        } else {
          setProvider(json.data);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("[OneAtlas] Failed to fetch provider details:", err);
          setError({
            code: "NETWORK_ERROR",
            message: err instanceof Error ? err.message : "Failed to connect to OneAtlas provider registry.",
          });
          setProvider(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    executeFetch();

    return () => {
      isCancelled = true;
    };
  }, [slug, reloadKey]);

  const handleRetry = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  // Filter and sort associated models
  const filteredModels = React.useMemo(() => {
    if (!provider || !provider.models) return [];
    let list = [...provider.models];

    // Search query
    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
          (m.tagline && m.tagline.toLowerCase().includes(q)) ||
          (m.architecture && m.architecture.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter((m) =>
        m.categories.some((c) => c.slug === selectedCategory)
      );
    }

    // License filter
    if (licenseFilter === "open-weights") {
      list = list.filter((m) => m.openWeights);
    } else if (licenseFilter === "proprietary") {
      list = list.filter((m) => !m.openWeights);
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "date-desc") {
        const da = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const db = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return db - da;
      }
      if (sortBy === "input-price-asc") {
        const pa = a.inputPricePerMillion ?? (a.openWeights ? 0 : 9999);
        const pb = b.inputPricePerMillion ?? (b.openWeights ? 0 : 9999);
        return pa - pb;
      }
      if (sortBy === "output-price-asc") {
        const pa = a.outputPricePerMillion ?? (a.openWeights ? 0 : 9999);
        const pb = b.outputPricePerMillion ?? (b.openWeights ? 0 : 9999);
        return pa - pb;
      }
      if (sortBy === "context-desc") {
        return (b.contextWindow || 0) - (a.contextWindow || 0);
      }
      return 0;
    });

    return list;
  }, [provider, modelSearch, selectedCategory, licenseFilter, sortBy]);

  // Visual avatar color utility
  const getProviderBrandGradient = (pSlug: string) => {
    switch (pSlug) {
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

  // Loading skeleton
  if (isLoading) {
    return <ProviderDetailSkeleton />;
  }

  // 404 Not Found state
  if (error?.code === "PROVIDER_NOT_FOUND") {
    return (
      <div className="py-16 text-center max-w-xl mx-auto space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Icons.AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="warning" size="md">
            404 — Provider Not Found
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Unknown AI Research Lab
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The provider with slug <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300 font-mono text-xs">{slug}</code> could not be found in the OneAtlas database registry.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button
            variant="primary"
            onClick={() => router.push("/providers")}
            className="flex items-center gap-2"
          >
            <Icons.ArrowLeft className="h-4 w-4" />
            <span>Return to Provider Directory</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <Icons.Search className="h-4 w-4" />
            <span>Browse Discovery Catalog</span>
          </Button>
        </div>
      </div>
    );
  }

  // Generic Error state
  if (error || !provider) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 space-y-2">
          <div className="flex items-center justify-center gap-2 font-semibold">
            <Icons.AlertCircle className="h-5 w-5 text-red-400" />
            <span>Failed to Load Provider Details</span>
          </div>
          <p className="text-xs text-red-200/80">{error?.message || "An unexpected error occurred."}</p>
        </div>
        <Button variant="primary" onClick={handleRetry} className="mx-auto">
          Retry Request
        </Button>
      </div>
    );
  }

  const brandClass = getProviderBrandGradient(provider.slug);

  // Toggle model comparison helper
  const handleToggleModel = (m: ModelDetailItem) => {
    toggleModel({
      id: m.id,
      slug: m.slug,
      name: m.name,
      provider: {
        name: provider.name,
        slug: provider.slug,
      },
      category: m.categories[0]?.name || "General LLM",
      inputPricePerMillion: m.inputPricePerMillion,
      outputPricePerMillion: m.outputPricePerMillion,
      contextWindow: m.contextWindow ?? undefined,
      parametersCount: m.parametersCount ?? undefined,
      openWeights: m.openWeights,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Breadcrumbs & Top Navigation Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link
            href="/"
            className="hover:text-sky-300 transition-colors flex items-center gap-1"
          >
            <Icons.Search className="h-3.5 w-3.5" />
            <span>Discovery</span>
          </Link>
          <span className="text-slate-600">/</span>
          <Link
            href="/providers"
            className="hover:text-sky-300 transition-colors flex items-center gap-1"
          >
            <Icons.Building className="h-3.5 w-3.5" />
            <span>Providers</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-100 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {provider.name}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/providers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Icons.ArrowLeft className="h-3.5 w-3.5" />
            <span>All Providers</span>
          </Link>

          {provider.websiteUrl && (
            <a
              href={provider.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              <Icons.Globe className="h-3.5 w-3.5 text-sky-400" />
              <span>Official Website</span>
              <Icons.ExternalLink className="h-3 w-3" />
            </a>
          )}

          <Link
            href={`/?provider=${encodeURIComponent(provider.slug)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all"
          >
            <Icons.Filter className="h-3.5 w-3.5" />
            <span>Filter Catalog</span>
          </Link>
        </div>
      </div>

      {/* 2. Hero Header & Lab Identity Card */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br ${brandClass} border font-black font-mono text-2xl sm:text-3xl flex items-center justify-center shadow-inner shrink-0`}
            >
              {provider.name.charAt(0)}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {provider.name}
                </h1>
                {provider.isVerified && (
                  <Badge variant="info" size="md" className="gap-1 font-mono text-xs">
                    <Icons.CheckCircle className="h-3.5 w-3.5 text-sky-400" />
                    <span>Verified Lab</span>
                  </Badge>
                )}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {provider.description || "Frontier research organization engineering advanced neural network systems."}
              </p>

              {/* Lab Metadata Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" size="sm" className="font-mono text-xs text-slate-300">
                  {provider.modelsCount} {provider.modelsCount === 1 ? "Active Model" : "Active Models"}
                </Badge>
                {provider.openWeightsCount > 0 && (
                  <Badge variant="success" size="sm" className="text-xs">
                    {provider.openWeightsCount} Open Weights
                  </Badge>
                )}
                {provider.proprietaryCount > 0 && (
                  <Badge variant="purple" size="sm" className="text-xs">
                    {provider.proprietaryCount} Proprietary Commercial
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lab Analytics: Pricing Economics & Top Benchmark Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pricing Economics Summary */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Icons.DollarSign className="h-4 w-4 text-emerald-400" />
              <span>Unit Economics & Pricing Summary</span>
            </h3>
            {provider.pricingSummary.hasFreeTier && (
              <Badge variant="success" size="sm">
                Open Weights / Free Tier
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Input Pricing Range
              </span>
              <div className="text-lg font-black font-mono text-emerald-400 mt-1">
                {provider.pricingSummary.minInputPrice !== null
                  ? `$${provider.pricingSummary.minInputPrice.toFixed(
                      provider.pricingSummary.minInputPrice < 1 ? 3 : 2
                    )} – $${provider.pricingSummary.maxInputPrice?.toFixed(2)}`
                  : provider.openWeightsCount > 0
                  ? "Free / Self-Hosted"
                  : "Custom Enterprise"}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Per 1M tokens</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Output Pricing Range
              </span>
              <div className="text-lg font-black font-mono text-sky-400 mt-1">
                {provider.pricingSummary.minOutputPrice !== null
                  ? `$${provider.pricingSummary.minOutputPrice.toFixed(
                      provider.pricingSummary.minOutputPrice < 1 ? 3 : 2
                    )} – $${provider.pricingSummary.maxOutputPrice?.toFixed(2)}`
                  : provider.openWeightsCount > 0
                  ? "Free / Self-Hosted"
                  : "Custom Enterprise"}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Per 1M tokens</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {provider.openWeightsCount === provider.modelsCount
              ? `${provider.name} models are 100% open-weights and deployable on private infrastructure without per-token API licensing costs.`
              : provider.proprietaryCount === provider.modelsCount
              ? `All ${provider.name} models operate as proprietary commercial APIs with token consumption billing.`
              : `${provider.name} supports a hybrid portfolio offering both self-hostable open weights and proprietary cloud-hosted frontier models.`}
          </p>
        </div>

        {/* Frontier Benchmark Highlights */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Icons.BarChart className="h-4 w-4 text-sky-400" />
              <span>Frontier Benchmark Highlights</span>
            </h3>
            <Link
              href="/leaderboard"
              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
            >
              <span>Full Leaderboard</span>
              <Icons.ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>

          {provider.topBenchmarkScores && provider.topBenchmarkScores.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {provider.topBenchmarkScores.slice(0, 3).map((bench) => {
                const isElo = bench.benchmarkSlug === "arena-elo" || bench.maxScore > 100;
                const formattedScore = isElo
                  ? `${Math.round(bench.score)} ELO`
                  : `${bench.score.toFixed(1)}%`;

                return (
                  <div
                    key={bench.benchmarkSlug}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {bench.benchmarkName}
                        </span>
                        {bench.isVerified && (
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1 py-0.2 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/models/${bench.modelSlug}`}
                        className="text-[11px] text-slate-400 hover:text-sky-300 font-mono transition-colors"
                      >
                        Achieved by: {bench.modelName}
                      </Link>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-sky-400">
                        {formattedScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              No verified benchmark records currently registered for this provider.
            </div>
          )}
        </div>
      </div>

      {/* 4. Associated Models Catalog Section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Icons.Cpu className="h-5 w-5 text-sky-400" />
              <span>{provider.name} Model Catalog</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredModels.length} of {provider.modelsCount} foundation models registered to this provider.
            </p>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search within this provider's models */}
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Icons.Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder={`Search ${provider.name} models...`}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {modelSearch && (
              <button
                type="button"
                onClick={() => setModelSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-white"
              >
                <Icons.Close className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Faceted Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            {provider.categories && provider.categories.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="py-1 px-2 text-xs rounded-md border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {provider.categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* License Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">License:</span>
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value as LicenseFilter)}
                className="py-1 px-2 text-xs rounded-md border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="all">All Licenses</option>
                <option value="open-weights">Open Weights</option>
                <option value="proprietary">Proprietary</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ModelSortOption)}
                className="py-1 px-2 text-xs rounded-md border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="name-asc">Model Name (A-Z)</option>
                <option value="date-desc">Release Date (Newest)</option>
                <option value="input-price-asc">Input Price (Low to High)</option>
                <option value="output-price-asc">Output Price (Low to High)</option>
                <option value="context-desc">Context Window (Largest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Model Cards Grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModels.map((m) => {
              const isSelected = isModelSelected(m.slug);
              const topology = parseParameterTopology(m.parametersCount, m.architecture);

              return (
                <div
                  key={m.id || m.slug}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 group relative ${
                    isSelected
                      ? "border-sky-500/70 bg-slate-900/95 ring-1 ring-sky-500/30 shadow-lg shadow-sky-500/5"
                      : "border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700/80"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top row: Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={m.openWeights ? "success" : "purple"}
                          size="sm"
                          className="text-[10px]"
                        >
                          {m.openWeights ? "Open Weights" : "Proprietary"}
                        </Badge>
                        {m.categories[0] && (
                          <Badge variant="outline" size="sm" className="text-[10px]">
                            {m.categories[0].name}
                          </Badge>
                        )}
                      </div>

                      {isSelected && (
                        <Badge variant="info" size="sm" className="gap-1 bg-sky-950 text-sky-300 border-sky-700/60 font-mono text-[10px]">
                          <Icons.Check className="h-2.5 w-2.5" />
                          In Tray
                        </Badge>
                      )}
                    </div>

                    {/* Model Title & Tagline */}
                    <div>
                      <Link
                        href={`/models/${m.slug}`}
                        className="text-lg font-bold text-white hover:text-sky-400 transition-colors tracking-tight block"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {m.tagline || m.description}
                      </p>
                    </div>

                    {/* Hardware & Spec Grid */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Parameters</span>
                        <span className="text-slate-200 font-semibold truncate block">
                          {topology.total}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Context</span>
                        <span className="text-slate-200 font-semibold truncate block">
                          {formatTokenCount(m.contextWindow)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Input / 1M</span>
                        <span className="text-emerald-400 font-semibold truncate block">
                          {formatPrice(m.inputPricePerMillion, m.openWeights)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Output / 1M</span>
                        <span className="text-sky-300 font-semibold truncate block">
                          {formatPrice(m.outputPricePerMillion, m.openWeights)}
                        </span>
                      </div>
                    </div>

                    {/* Top Benchmark Preview */}
                    {m.benchmarks && m.benchmarks.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">
                            {m.benchmarks[0].name}
                          </span>
                          <span className="font-mono text-sky-400 font-bold">
                            {m.benchmarks[0].slug === "arena-elo" || m.benchmarks[0].maxScore > 100
                              ? `${Math.round(m.benchmarks[0].score)} ELO`
                              : `${m.benchmarks[0].score.toFixed(1)}%`}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                m.benchmarks[0].maxScore > 100
                                  ? ((m.benchmarks[0].score - 1000) / 400) * 100
                                  : (m.benchmarks[0].score / m.benchmarks[0].maxScore) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500 truncate max-w-[130px]">
                      {m.architecture || "Dense Transformer"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant={isSelected ? "primary" : "ghost"}
                        size="sm"
                        className={`px-2.5 transition-all cursor-pointer flex items-center gap-1 text-xs ${
                          isSelected
                            ? "bg-sky-600 hover:bg-sky-500 text-white shadow-sm ring-1 ring-sky-400/40"
                            : "text-slate-300 hover:text-sky-300 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-800/60"
                        }`}
                        onClick={() => handleToggleModel(m)}
                        title={isSelected ? "Remove from comparison" : "Add to comparison"}
                      >
                        {isSelected ? (
                          <>
                            <Icons.Check className="h-3 w-3 text-white" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Icons.Scale className="h-3 w-3" />
                            <span>Compare</span>
                          </>
                        )}
                      </Button>

                      <Link
                        href={`/models/${m.slug}`}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                      >
                        <span>Intel</span>
                        <Icons.ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Catalog State */
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Icons.Cpu className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Models Found</h3>
              <p className="text-xs text-slate-400">
                No {provider.name} models match your active search or filter criteria.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setModelSearch("");
                setSelectedCategory("all");
                setLicenseFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading Skeleton state for Provider Detail
 */
function ProviderDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="h-4 w-48 bg-slate-800 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-slate-800 rounded-lg" />
          <div className="h-8 w-28 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Hero Header Skeleton */}
      <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="h-20 w-20 bg-slate-800 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-8 w-60 bg-slate-800 rounded-lg" />
            <div className="h-4 w-96 bg-slate-800/60 rounded" />
          </div>
        </div>
      </div>

      {/* 2 Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-44 rounded-2xl border border-slate-800 bg-slate-900/50" />
        <div className="h-44 rounded-2xl border border-slate-800 bg-slate-900/50" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl border border-slate-800 bg-slate-900/40" />
        ))}
      </div>
    </div>
  );
}
