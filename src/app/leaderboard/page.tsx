"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useComparison } from "@/context/ComparisonContext";
import { formatPrice, formatTokenCount } from "@/lib/utils";

interface RankedModelItem {
  rank: number;
  score: number;
  isVerified: boolean;
  notes: string | null;
  sourceUrl: string | null;
  evaluatedAt: string;
  model: {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    openWeights: boolean;
    architecture: string | null;
    parametersCount: string | null;
    contextWindow: number | null;
    inputPricePerMillion: number | null;
    outputPricePerMillion: number | null;
    documentationUrl: string | null;
    huggingFaceUrl: string | null;
    provider: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
      isVerified: boolean;
    };
  };
}

interface BenchmarkSuite {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  maxScore: number;
  evaluatedModelsCount: number;
  rankings: RankedModelItem[];
}

type CategoryFilter = "overall" | "reasoning-math" | "coding" | "knowledge";

const CATEGORIES: Array<{ id: CategoryFilter; name: string; description: string; benchmarks: string[] }> = [
  {
    id: "overall",
    name: "Overall",
    description: "Human-preference blind A/B evaluation and foundational general capabilities.",
    benchmarks: ["arena-elo", "mmlu-pro", "mmlu"],
  },
  {
    id: "reasoning-math",
    name: "Reasoning & Math",
    description: "Multi-step algorithmic deduction, formal mathematical proofs, and competition STEM.",
    benchmarks: ["math-500", "gsm8k", "mmlu-pro"],
  },
  {
    id: "coding",
    name: "Coding",
    description: "End-to-end software engineering bug resolution and algorithmic program synthesis.",
    benchmarks: ["swe-bench", "humaneval"],
  },
  {
    id: "knowledge",
    name: "General Knowledge",
    description: "Broad academic knowledge, humanities, law, STEM, and multimodal understanding.",
    benchmarks: ["mmlu", "mmlu-pro", "arena-elo"],
  },
];

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isModelSelected, toggleModel } = useComparison();

  // Benchmarks data from live PostgreSQL API
  const [suites, setSuites] = React.useState<BenchmarkSuite[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Active Category & Benchmark selection
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>(() => {
    const cat = searchParams.get("category")?.toLowerCase() as CategoryFilter;
    return CATEGORIES.some((c) => c.id === cat) ? cat : "overall";
  });

  const [activeBenchmarkSlug, setActiveBenchmarkSlug] = React.useState<string>(() => {
    return searchParams.get("benchmark") || "arena-elo";
  });

  // Table filtering and sorting
  const [providerFilter, setProviderFilter] = React.useState<string>("");
  const [licenseFilter, setLicenseFilter] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc");
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  // Fetch full benchmark suites and rankings from API on mount
  React.useEffect(() => {
    let isCancelled = false;

    async function fetchBenchmarkRankings() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/benchmarks?includeAllScores=true");
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          if (!isCancelled) {
            setSuites(json.data);
          }
        } else {
          throw new Error(json.error?.message || "Failed to parse benchmark rankings");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to fetch benchmark suites:", err);
          setError(err instanceof Error ? err.message : "Failed to load leaderboard data");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchBenchmarkRankings();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Available benchmarks for the active category
  const categoryConfig = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  const availableSuitesForCategory = React.useMemo(() => {
    if (suites.length === 0) return [];
    if (activeCategory === "overall") {
      // In overall, show all 7 benchmarks with Arena ELO prioritized
      return [...suites].sort((a, b) => {
        if (a.slug === "arena-elo") return -1;
        if (b.slug === "arena-elo") return 1;
        return a.name.localeCompare(b.name);
      });
    }
    return suites.filter((s) => categoryConfig.benchmarks.includes(s.slug));
  }, [suites, activeCategory, categoryConfig.benchmarks]);

  // Effective active benchmark slug: if activeBenchmarkSlug is not in availableSuitesForCategory, use the first available
  const effectiveBenchmarkSlug = React.useMemo(() => {
    if (availableSuitesForCategory.length === 0) return activeBenchmarkSlug;
    const match = availableSuitesForCategory.some((s) => s.slug === activeBenchmarkSlug);
    return match ? activeBenchmarkSlug : availableSuitesForCategory[0].slug;
  }, [availableSuitesForCategory, activeBenchmarkSlug]);

  // Synchronize category and benchmark with URL query params
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "overall") params.set("category", activeCategory);
    if (effectiveBenchmarkSlug) params.set("benchmark", effectiveBenchmarkSlug);
    const queryString = params.toString();
    const targetUrl = queryString ? `/leaderboard?${queryString}` : "/leaderboard";
    router.replace(targetUrl, { scroll: false });
  }, [activeCategory, effectiveBenchmarkSlug, router]);

  // Current active benchmark suite
  const currentSuite = React.useMemo(() => {
    return suites.find((s) => s.slug === effectiveBenchmarkSlug) || availableSuitesForCategory[0] || null;
  }, [suites, effectiveBenchmarkSlug, availableSuitesForCategory]);

  // Extract unique providers present in the current benchmark rankings
  const availableProviders = React.useMemo(() => {
    if (!currentSuite || !currentSuite.rankings) return [];
    const map = new Map<string, { name: string; slug: string }>();
    currentSuite.rankings.forEach((r) => {
      if (r.model.provider) {
        map.set(r.model.provider.slug, {
          name: r.model.provider.name,
          slug: r.model.provider.slug,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [currentSuite]);

  // Filter and sort rankings for current benchmark table
  const filteredRankings = React.useMemo(() => {
    if (!currentSuite || !currentSuite.rankings) return [];

    let list = [...currentSuite.rankings];

    // Exclude missing scores (only models with valid numeric scores are in currentSuite.rankings)
    list = list.filter((item) => item.score !== null && item.score !== undefined);

    // Filter by Provider
    if (providerFilter) {
      list = list.filter((item) => item.model.provider.slug === providerFilter);
    }

    // Filter by License
    if (licenseFilter === "open-weights") {
      list = list.filter((item) => item.model.openWeights === true);
    } else if (licenseFilter === "proprietary") {
      list = list.filter((item) => item.model.openWeights === false);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.model.name.toLowerCase().includes(q) ||
          item.model.provider.name.toLowerCase().includes(q) ||
          (item.model.architecture && item.model.architecture.toLowerCase().includes(q))
      );
    }

    // Sort Order
    list.sort((a, b) => {
      return sortOrder === "desc" ? b.score - a.score : a.score - b.score;
    });

    return list;
  }, [currentSuite, providerFilter, licenseFilter, searchQuery, sortOrder]);

  // Top 3 performers for podium cards
  const topThree = React.useMemo(() => {
    if (!currentSuite || !currentSuite.rankings) return [];
    // The canonical top 3 scores for this benchmark overall (unfiltered)
    const sorted = [...currentSuite.rankings].sort((a, b) => b.score - a.score);
    return sorted.slice(0, 3);
  }, [currentSuite]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRankings.length / pageSize) || 1;
  const paginatedRows = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRankings.slice(startIndex, startIndex + pageSize);
  }, [filteredRankings, currentPage, pageSize]);

  // Reset page when filters change
  const handleCategoryChange = (cat: CategoryFilter) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleBenchmarkChange = (slug: string) => {
    setActiveBenchmarkSlug(slug);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const isEloUnit = currentSuite?.maxScore ? currentSuite.maxScore > 100 : false;
  const formatScore = (val: number) => {
    if (isEloUnit) {
      return `${Math.round(val)} ELO`;
    }
    return `${val.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Link href="/" className="hover:text-white transition-colors">
              Discovery
            </Link>
            <span>/</span>
            <span className="text-sky-400">Foundation Model Leaderboards</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Icons.BarChart className="h-7 w-7 text-sky-400" />
            Rankings & Standardized Benchmarks
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Verified comparative performance evaluations across reasoning, coding, mathematics, and human preference.
            Scores are sourced directly from PostgreSQL with strict provenance auditing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-300 hover:bg-sky-900/60 transition-colors"
          >
            <Icons.Scale className="h-3.5 w-3.5" />
            <span>Open Compare Matrix</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Icons.Cpu className="h-3.5 w-3.5" />
            <span>All Models</span>
          </Link>
        </div>
      </div>

      {/* Primary Category Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm shadow-sky-500/10"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                }`}
              >
                <span>{cat.name}</span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 font-mono hidden md:block">
          {categoryConfig.description}
        </div>
      </div>

      {/* Benchmark Suite Selection Tabs */}
      {availableSuitesForCategory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Evaluation Suites ({availableSuitesForCategory.length})
            </span>
            {currentSuite && (
              <span className="text-[11px] font-mono text-slate-400">
                Metric: <strong className="text-slate-200">{isEloUnit ? "Bradley-Terry ELO Points" : "Pass@1 Accuracy (%)"}</strong>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {availableSuitesForCategory.map((suite) => {
              const isSelected = currentSuite?.slug === suite.slug;
              return (
                <button
                  key={suite.slug}
                  type="button"
                  onClick={() => handleBenchmarkChange(suite.slug)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-white border-sky-500/60 shadow-md ring-1 ring-sky-500/20"
                      : "bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <span className="font-semibold">{suite.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected
                        ? "bg-sky-950 text-sky-300 border border-sky-800/60"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {suite.evaluatedModelsCount} evaluated
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-slate-800/80 bg-slate-900/40 animate-pulse p-5 space-y-3"
              >
                <div className="h-5 w-24 bg-slate-800 rounded" />
                <div className="h-8 w-40 bg-slate-800/60 rounded" />
                <div className="h-4 w-32 bg-slate-800/40 rounded" />
              </div>
            ))}
          </div>
          <div className="h-96 rounded-2xl border border-slate-800/80 bg-slate-900/40 animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-8 text-center rounded-2xl border border-rose-900/60 bg-rose-950/20 max-w-xl mx-auto space-y-3">
          <Icons.AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">Error Loading Benchmark Data</h3>
          <p className="text-xs text-rose-300">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs mt-2"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Benchmark Content */}
      {!isLoading && !error && currentSuite && (
        <div className="space-y-6">
          {/* Active Benchmark Description Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 sm:p-5 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider font-mono">
                  {currentSuite.category || "Standardized Evaluation"}
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-xs text-slate-400">
                  {currentSuite.evaluatedModelsCount} Models Evaluated
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{currentSuite.name}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{currentSuite.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0 font-mono text-xs">
              <Badge variant="outline" size="sm" className="bg-slate-950">
                Max Scale: {isEloUnit ? `${currentSuite.maxScore} ELO` : `${currentSuite.maxScore}%`}
              </Badge>
              <Badge variant="info" size="sm" className="bg-sky-950/80 text-sky-300 border-sky-800/60">
                Zero-Fabrication Guarantee
              </Badge>
            </div>
          </div>

          {/* Top 3 Podium Highlights */}
          {topThree.length >= 3 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  Top 3 Ranked Performers
                </span>
                <span className="text-[11px] font-mono text-slate-500">Official Evaluation Leaders</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topThree.map((item, idx) => {
                  const isGold = idx === 0;
                  const isSilver = idx === 1;

                  const borderClass = isGold
                    ? "border-amber-500/50 bg-gradient-to-br from-slate-900/90 via-amber-950/20 to-slate-900/90 shadow-lg shadow-amber-500/5"
                    : isSilver
                    ? "border-slate-500/40 bg-gradient-to-br from-slate-900/90 via-slate-800/30 to-slate-900/90"
                    : "border-orange-600/40 bg-gradient-to-br from-slate-900/90 via-orange-950/20 to-slate-900/90";

                  const rankBadge = isGold
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                    : isSilver
                    ? "bg-slate-300/20 text-slate-200 border-slate-400/50"
                    : "bg-orange-600/20 text-orange-300 border-orange-500/50";

                  const rankText = isGold ? "#1 Gold Leader" : isSilver ? "#2 Silver" : "#3 Bronze";

                  const isModelInTray = isModelSelected(item.model.slug);

                  return (
                    <div
                      key={item.model.slug}
                      className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all backdrop-blur-sm ${borderClass}`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${rankBadge}`}>
                            {rankText}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {item.model.provider.name}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight hover:text-sky-300 transition-colors">
                            <Link href={`/models/${item.model.slug}`} className="hover:underline">
                              {item.model.name}
                            </Link>
                          </h3>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.model.tagline || item.model.architecture}
                          </p>
                        </div>

                        <div className="pt-2 flex items-baseline justify-between border-t border-slate-800/60">
                          <span className="text-xs text-slate-400">Evaluated Score:</span>
                          <span
                            className={`text-xl font-extrabold font-mono ${
                              isGold ? "text-amber-300" : isSilver ? "text-slate-100" : "text-orange-300"
                            }`}
                          >
                            {formatScore(item.score)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>Params: {item.model.parametersCount || "Proprietary"}</span>
                          <span>Context: {formatTokenCount(item.model.contextWindow || 0)}</span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleModel({
                              id: item.model.id,
                              slug: item.model.slug,
                              name: item.model.name,
                              provider: { name: item.model.provider.name, slug: item.model.provider.slug },
                              openWeights: item.model.openWeights,
                            })
                          }
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            isModelInTray
                              ? "bg-sky-600 text-white hover:bg-sky-500"
                              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          }`}
                        >
                          <Icons.Scale className="h-3 w-3" />
                          <span>{isModelInTray ? "In Tray" : "Compare"}</span>
                        </button>

                        {(item.model.documentationUrl || item.model.huggingFaceUrl) && (
                          <a
                            href={item.model.documentationUrl || item.model.huggingFaceUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                          >
                            <span>Intel</span>
                            <Icons.ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtering & Search Controls for the Leaderboard */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search within this benchmark */}
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Icons.Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ranked models..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-white"
                >
                  <Icons.Close className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Faceted Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Lab Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Lab:</span>
                <select
                  value={providerFilter}
                  onChange={(e) => {
                    setProviderFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 text-xs rounded-md border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="">All Labs</option>
                  {availableProviders.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* License Filter */}
              <div className="flex items-center gap-1 ml-0 sm:ml-2">
                <span className="text-slate-400">License:</span>
                <select
                  value={licenseFilter}
                  onChange={(e) => {
                    setLicenseFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 text-xs rounded-md border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="">All Licenses</option>
                  <option value="open-weights">Open Weights Only</option>
                  <option value="proprietary">Proprietary API Only</option>
                </select>
              </div>

              {/* Sort Order */}
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                className="px-2.5 py-1 text-xs rounded-md border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer flex items-center gap-1 ml-0 sm:ml-2"
                title="Toggle score sort direction"
              >
                <span>Score: {sortOrder === "desc" ? "High to Low" : "Low to High"}</span>
              </button>

              {/* Active Filter Clear */}
              {(Boolean(providerFilter) || Boolean(licenseFilter) || Boolean(searchQuery)) && (
                <button
                  type="button"
                  onClick={() => {
                    setProviderFilter("");
                    setLicenseFilter("");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="text-xs text-sky-400 hover:text-sky-300 px-2 py-1 ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Empty Table State */}
          {filteredRankings.length === 0 && (
            <div className="p-10 text-center rounded-2xl border border-slate-800/80 bg-slate-900/40 space-y-3">
              <Icons.AlertCircle className="h-7 w-7 text-slate-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Models Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No evaluated models match the current filter criteria for {currentSuite.name}.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProviderFilter("");
                  setLicenseFilter("");
                  setSearchQuery("");
                }}
                className="text-xs mt-1"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Authoritative Ranked Table */}
          {filteredRankings.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm shadow-xl">
              <table className="w-full border-collapse text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5 px-4 w-16 text-center">Rank</th>
                    <th className="p-3.5 px-4">AI Model & Research Lab</th>
                    <th className="p-3.5 px-4 w-52 sm:w-64">
                      Evaluated Score ({isEloUnit ? "ELO" : "%"})
                    </th>
                    <th className="p-3.5 px-4 w-44">Audit Provenance</th>
                    <th className="p-3.5 px-4 w-36">Pricing (1M)</th>
                    <th className="p-3.5 px-4 w-28">Context</th>
                    <th className="p-3.5 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {paginatedRows.map((item, idx) => {
                    const actualRank = (currentPage - 1) * pageSize + idx + 1;
                    const isTop1 = actualRank === 1;
                    const isTop2 = actualRank === 2;
                    const isTop3 = actualRank === 3;

                    const percentageRatio = Math.min((item.score / currentSuite.maxScore) * 100, 100);

                    const isModelInTray = isModelSelected(item.model.slug);

                    return (
                      <tr
                        key={item.model.slug}
                        className={`hover:bg-slate-900/60 transition-colors ${
                          isTop1
                            ? "bg-amber-950/10"
                            : isTop2
                            ? "bg-slate-800/10"
                            : isTop3
                            ? "bg-orange-950/10"
                            : ""
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="p-3.5 px-4 text-center font-mono align-middle">
                          <span
                            className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                              isTop1
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                                : isTop2
                                ? "bg-slate-300/20 text-slate-200 border border-slate-400/50"
                                : isTop3
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                                : "text-slate-400"
                            }`}
                          >
                            {actualRank}
                          </span>
                        </td>

                        {/* Model & Provider */}
                        <td className="p-3.5 px-4 align-middle">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/models/${item.model.slug}`}
                                className="font-bold text-white text-sm hover:text-sky-300 hover:underline transition-colors"
                              >
                                {item.model.name}
                              </Link>
                              <Badge
                                variant={item.model.openWeights ? "success" : "purple"}
                                size="sm"
                                className="text-[10px] py-0 px-1"
                              >
                                {item.model.openWeights ? "Open Weights" : "Proprietary"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-medium text-slate-300">
                                {item.model.provider.name}
                              </span>
                              <span>&bull;</span>
                              <span className="font-mono text-slate-400 truncate max-w-[150px]">
                                {item.model.architecture || "Dense Transformer"}
                              </span>
                              {item.model.parametersCount && (
                                <>
                                  <span>&bull;</span>
                                  <span className="font-mono text-slate-400">
                                    {item.model.parametersCount}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Score & Progress Bar */}
                        <td className="p-3.5 px-4 align-middle font-mono">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-extrabold text-sm ${
                                  isTop1
                                    ? "text-amber-300"
                                    : isTop2
                                    ? "text-slate-100"
                                    : isTop3
                                    ? "text-orange-300"
                                    : "text-sky-400"
                                }`}
                              >
                                {formatScore(item.score)}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                / {isEloUnit ? `${currentSuite.maxScore} ELO` : "100%"}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isTop1
                                    ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                                    : "bg-gradient-to-r from-sky-500 to-indigo-500"
                                }`}
                                style={{ width: `${percentageRatio}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Provenance Badge */}
                        <td className="p-3.5 px-4 align-middle font-sans">
                          {item.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/40">
                              <Icons.CheckCircle className="h-2.5 w-2.5 shrink-0" />
                              <span>Verified LMSYS/Lab</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                              <span>Estimated Baseline</span>
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[160px]" title={item.notes}>
                              {item.notes}
                            </span>
                          )}
                        </td>

                        {/* Pricing */}
                        <td className="p-3.5 px-4 align-middle font-mono text-[11px]">
                          <span className="text-slate-200 block">
                            {formatPrice(item.model.inputPricePerMillion, item.model.openWeights)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            out: {formatPrice(item.model.outputPricePerMillion, item.model.openWeights)}
                          </span>
                        </td>

                        {/* Context Window */}
                        <td className="p-3.5 px-4 align-middle font-mono text-slate-300 text-xs">
                          {formatTokenCount(item.model.contextWindow || 0)}
                        </td>

                        {/* Actions: Compare & Intel */}
                        <td className="p-3.5 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                toggleModel({
                                  id: item.model.id,
                                  slug: item.model.slug,
                                  name: item.model.name,
                                  provider: { name: item.model.provider.name, slug: item.model.provider.slug },
                                  openWeights: item.model.openWeights,
                                })
                              }
                              className={`p-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                                isModelInTray
                                  ? "bg-sky-600 text-white"
                                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                              }`}
                              title={isModelInTray ? "Remove from comparison" : "Add to comparison matrix"}
                              aria-label={isModelInTray ? `Remove ${item.model.name}` : `Compare ${item.model.name}`}
                            >
                              <Icons.Scale className="h-3.5 w-3.5" />
                            </button>

                            {(item.model.documentationUrl || item.model.huggingFaceUrl) && (
                              <a
                                href={item.model.documentationUrl || item.model.huggingFaceUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                title="Open documentation or model card"
                              >
                                <Icons.ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table Footer / Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 px-4 border-t border-slate-800/80 bg-slate-950/60 text-xs text-slate-400">
                <div className="font-mono">
                  Showing{" "}
                  <strong className="text-white">
                    {(currentPage - 1) * pageSize + 1} -{" "}
                    {Math.min(currentPage * pageSize, filteredRankings.length)}
                  </strong>{" "}
                  of <strong className="text-white">{filteredRankings.length}</strong> ranked models
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span>Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-200 focus:outline-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 font-mono">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="py-1 px-2.5 h-auto text-xs"
                      >
                        Prev
                      </Button>
                      <span className="px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="py-1 px-2.5 h-auto text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ranking Methodology & Evaluation Governance Section */}
          <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-sky-950/20 p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2">
              <Icons.BookOpen className="h-5 w-5 text-sky-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Ranking Methodology & Evaluation Governance
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <span className="font-semibold text-emerald-400 block font-mono text-[11px] uppercase">
                  1. Metric Integrity & Separation
                </span>
                <p>
                  Percentages (e.g. MMLU-Pro, SWE-bench) and Bradley-Terry ELO points (Chatbot Arena) are evaluated on separate, un-conflated axes. Incompatible units are never averaged together into synthetic pseudo-metrics.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <span className="font-semibold text-sky-400 block font-mono text-[11px] uppercase">
                  2. Missing Value Exclusion
                </span>
                <p>
                  Models that lack public evaluations on a benchmark suite are strictly excluded from that suite&apos;s leaderboard. OneAtlas never fills un-evaluated models with invented or interpolated baseline scores.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <span className="font-semibold text-purple-400 block font-mono text-[11px] uppercase">
                  3. Audit Provenance Tracking
                </span>
                <p>
                  Scores backed by published peer-reviewed reports or verified LMSYS crowdsourced evaluations receive the Verified audit badge. Synthetic demo baselines are explicitly tagged for full transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading benchmark leaderboards...
        </div>
      }
    >
      <LeaderboardContent />
    </React.Suspense>
  );
}
