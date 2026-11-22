"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useComparison } from "@/context/ComparisonContext";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatTokenCount } from "@/lib/utils";

interface BenchmarkRecord {
  id: string;
  benchmarkId: string;
  name: string;
  slug: string;
  category: string | null;
  score: number;
  maxScore: number;
  isVerified: boolean;
  notes: string | null;
}

interface DetailedModel {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  architecture: string | null;
  parametersCount: string | null;
  contextWindow: number | null;
  license: string | null;
  openWeights: boolean;
  releaseDate: string | null;
  isFeatured: boolean;
  documentationUrl: string | null;
  huggingFaceUrl: string | null;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  provider: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    isVerified: boolean;
  };
  categories: Array<{ id: string; name: string; slug: string }>;
  benchmarks: BenchmarkRecord[];
}

interface AvailableModelItem {
  id: string;
  name: string;
  slug: string;
  provider: { name: string; slug: string };
  openWeights: boolean;
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedModels,
    removeModel,
    clearAll,
    addModel,
    setFromSlugs,
    maxLimit,
  } = useComparison();

  const [modelsData, setModelsData] = React.useState<DetailedModel[]>([]);
  const [allAvailableModels, setAllAvailableModels] = React.useState<AvailableModelItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = React.useState(false);

  // Sync from URL search params on mount if models query param exists
  React.useEffect(() => {
    const modelsParam = searchParams.get("models");
    if (modelsParam) {
      const slugs = modelsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (slugs.length > 0 && selectedModels.length === 0) {
        setFromSlugs(slugs);
      }
    }
  }, [searchParams, selectedModels.length, setFromSlugs]);

  // Keep URL query string in sync with current selected models
  React.useEffect(() => {
    if (selectedModels.length > 0) {
      const currentParam = searchParams.get("models") || "";
      const targetParam = selectedModels.map((m) => m.slug).join(",");
      if (currentParam !== targetParam) {
        router.replace(`/compare?models=${targetParam}`, { scroll: false });
      }
    } else {
      router.replace("/compare", { scroll: false });
    }
  }, [selectedModels, searchParams, router]);

  // Fetch full details for all selected models
  React.useEffect(() => {
    let isCancelled = false;

    async function loadComparisonData() {
      if (selectedModels.length === 0) {
        setModelsData([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetched = await Promise.all(
          selectedModels.map(async (item) => {
            const res = await fetch(`/api/models/${item.slug}`);
            if (!res.ok) {
              throw new Error(`Failed to load details for ${item.name} (${res.status})`);
            }
            const json = await res.json();
            if (!json.success || !json.data) {
              throw new Error(json.error?.message || `Failed to parse data for ${item.name}`);
            }
            return json.data as DetailedModel;
          })
        );

        if (!isCancelled) {
          setModelsData(fetched);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error loading comparison models:", err);
          setError(err instanceof Error ? err.message : "Failed to load model details");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadComparisonData();

    return () => {
      isCancelled = true;
    };
  }, [selectedModels]);

  // Fetch all available models catalog for "Add Model" dropdown
  React.useEffect(() => {
    fetch("/api/models?limit=50")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setAllAvailableModels(
            json.data.map((m: DetailedModel) => ({
              id: m.id,
              name: m.name,
              slug: m.slug,
              provider: { name: m.provider.name, slug: m.provider.slug },
              openWeights: m.openWeights,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Compute Best In Class Metrics
  const bestMetrics = React.useMemo<{
    minInput: number | null;
    minOutput: number | null;
    maxContext: number | null;
    bestScores: Record<string, number>;
  }>(() => {
    if (modelsData.length === 0) return { minInput: null, minOutput: null, maxContext: null, bestScores: {} };

    // Lowest Input Price (USD per 1M)
    let minInput: number | null = null;
    modelsData.forEach((m) => {
      const effectivePrice = m.openWeights ? 0 : m.inputPricePerMillion;
      if (effectivePrice !== null && effectivePrice !== undefined) {
        if (minInput === null || effectivePrice < minInput) {
          minInput = effectivePrice;
        }
      }
    });

    // Lowest Output Price (USD per 1M)
    let minOutput: number | null = null;
    modelsData.forEach((m) => {
      const effectivePrice = m.openWeights ? 0 : m.outputPricePerMillion;
      if (effectivePrice !== null && effectivePrice !== undefined) {
        if (minOutput === null || effectivePrice < minOutput) {
          minOutput = effectivePrice;
        }
      }
    });

    // Largest Context Window
    let maxContext: number | null = null;
    modelsData.forEach((m) => {
      if (m.contextWindow) {
        if (maxContext === null || m.contextWindow > maxContext) {
          maxContext = m.contextWindow;
        }
      }
    });

    // Highest Benchmark Scores per Benchmark Name
    const bestScores: Record<string, number> = {};
    modelsData.forEach((m) => {
      m.benchmarks.forEach((b) => {
        if (b.score !== null && b.score !== undefined) {
          const currentBest = bestScores[b.name];
          if (currentBest === undefined || b.score > currentBest) {
            bestScores[b.name] = b.score;
          }
        }
      });
    });

    return { minInput, minOutput, maxContext, bestScores };
  }, [modelsData]);

  // Aggregate all benchmark names present across selected models
  const allBenchmarkNames = React.useMemo(() => {
    const names = new Set<string>();
    modelsData.forEach((m) => {
      m.benchmarks.forEach((b) => names.add(b.name));
    });
    // Standard sorting priority: MMLU-Pro, SWE-bench, HumanEval, MATH-500, GSM8K, Arena ELO
    const priority = [
      "MMLU-Pro",
      "MMLU",
      "SWE-bench Verified",
      "HumanEval",
      "MATH-500",
      "GSM8K",
      "Chatbot Arena ELO",
    ];
    return Array.from(names).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [modelsData]);

  // Available models not already in comparison
  const candidateModelsToAdd = allAvailableModels.filter(
    (m) => !selectedModels.some((sel) => sel.slug === m.slug)
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Link href="/" className="hover:text-white transition-colors">
              Discovery
            </Link>
            <span>/</span>
            <span className="text-slate-200">Architecture Arena</span>
            <span>/</span>
            <span className="text-sky-400">Model Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Icons.Scale className="h-7 w-7 text-sky-400" />
            Frontier Model Comparison Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Side-by-side architecture topologies, verified evaluation audits, unit economic token pricing, and context limits.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Icons.ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Discovery</span>
          </Link>
          {selectedModels.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-xs text-rose-400 hover:text-rose-300 border-rose-900/60 hover:bg-rose-950/30"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* State: Less than 2 Models Selected */}
      {selectedModels.length < 2 && !isLoading && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-950/80 border border-sky-800/60 text-sky-400">
            <Icons.Scale className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {selectedModels.length === 1
                ? "Select at least 1 more model to compare"
                : "Select 2 to 4 models to initiate comparison"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Compare parameter size, context capacity, token pricing per 1M tokens, and verified reasoning benchmark evaluations side-by-side.
            </p>
          </div>

          {selectedModels.length === 1 && (
            <div className="inline-flex items-center gap-2 p-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-400">Current Model:</span>
              <strong className="text-white">{selectedModels[0].name}</strong>
              <span className="text-slate-500">({selectedModels[0].provider.name})</span>
            </div>
          )}

          {/* Quick Comparison Presets */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Popular Frontier Head-to-Head Comparisons
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                {
                  label: "Claude 3.5 Sonnet vs DeepSeek R1",
                  slugs: ["claude-3-5-sonnet", "deepseek-r1"],
                },
                {
                  label: "OpenAI o3-mini vs DeepSeek R1",
                  slugs: ["o3-mini", "deepseek-r1"],
                },
                {
                  label: "GPT-4o vs Claude 3.5 Sonnet vs Gemini 2.0 Flash",
                  slugs: ["gpt-4o", "claude-3-5-sonnet", "gemini-2-0-flash"],
                },
                {
                  label: "Llama 3.1 405B vs DeepSeek V3 (Open Weights)",
                  slugs: ["llama-3-1-405b", "deepseek-v3"],
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFromSlugs(preset.slugs)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-sky-500/60 hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium text-xs shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer"
            >
              <Icons.Sparkles className="h-4 w-4" />
              <span>Browse Catalog & Pick Models</span>
            </Link>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-10 w-48 bg-slate-800/60 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl border border-slate-800/80 bg-slate-900/40 animate-pulse p-6 space-y-4"
              >
                <div className="h-6 w-32 bg-slate-800 rounded" />
                <div className="h-4 w-48 bg-slate-800/60 rounded" />
                <div className="space-y-2 pt-4">
                  <div className="h-8 bg-slate-800/40 rounded" />
                  <div className="h-8 bg-slate-800/40 rounded" />
                  <div className="h-8 bg-slate-800/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 text-center rounded-2xl border border-rose-900/60 bg-rose-950/20 max-w-xl mx-auto space-y-3">
          <Icons.AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">Comparison Retrieval Failed</h3>
          <p className="text-xs text-rose-300">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs mt-2"
          >
            Retry Loading
          </Button>
        </div>
      )}

      {/* Full Comparison Table Matrix (>= 2 Models) */}
      {selectedModels.length >= 2 && !isLoading && modelsData.length >= 2 && (
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-white">Comparing {modelsData.length} Models</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-400">
                Green badges indicate best-in-class pricing, context, or benchmark results
              </span>
            </div>

            {/* Add Model Dropdown if less than maxLimit */}
            {selectedModels.length < maxLimit && candidateModelsToAdd.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAddDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-300 hover:bg-sky-900/60 transition-colors cursor-pointer"
                >
                  <Icons.Plus className="h-3.5 w-3.5" />
                  <span>Add Another Model ({selectedModels.length}/{maxLimit})</span>
                </button>

                {isAddDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-64 max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl z-30">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Select Model to Compare
                    </div>
                    {candidateModelsToAdd.map((cand) => (
                      <button
                        key={cand.slug}
                        type="button"
                        onClick={() => {
                          addModel({
                            id: cand.id,
                            slug: cand.slug,
                            name: cand.name,
                            provider: cand.provider,
                            openWeights: cand.openWeights,
                          });
                          setIsAddDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="truncate">{cand.name}</span>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                          {cand.provider.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side-by-Side Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm shadow-xl">
            <table className="w-full border-collapse text-left text-xs min-w-[720px]">
              {/* Header Row: Model Identity Cards */}
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80">
                  <th className="p-4 sm:p-5 w-48 sm:w-56 text-slate-400 font-mono text-[11px] uppercase tracking-wider align-top">
                    Feature & Dimension
                  </th>
                  {modelsData.map((model) => (
                    <th key={model.slug} className="p-4 sm:p-5 align-top border-l border-slate-800/80">
                      <div className="space-y-2">
                        {/* Provider & Action */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-slate-400">
                            {model.provider.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeModel(model.slug)}
                            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title={`Remove ${model.name} from comparison`}
                            aria-label={`Remove ${model.name}`}
                          >
                            <Icons.Close className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Model Title */}
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          <Link href={`/models/${model.slug}`} className="hover:underline hover:text-sky-300 transition-colors">
                            {model.name}
                          </Link>
                        </h3>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          <Badge
                            variant={model.openWeights ? "success" : "purple"}
                            size="sm"
                          >
                            {model.openWeights ? "Open Weights" : "Proprietary"}
                          </Badge>
                          {model.categories[0] && (
                            <Badge variant="outline" size="sm" className="text-[10px]">
                              {model.categories[0].name}
                            </Badge>
                          )}
                        </div>

                        {/* Intel Link */}
                        {(model.documentationUrl || model.huggingFaceUrl) && (
                          <div className="pt-1">
                            <a
                              href={model.documentationUrl || model.huggingFaceUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                            >
                              <span>Official Intel</span>
                              <Icons.ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* SECTION 1: ARCHITECTURE & HARDWARE SPECS */}
                <tr className="bg-slate-950/60 border-t border-b border-slate-800">
                  <td
                    colSpan={modelsData.length + 1}
                    className="p-3 px-4 font-mono text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2"
                  >
                    <Icons.Cpu className="h-4 w-4" />
                    <span>Neural Architecture & Core Specifications</span>
                  </td>
                </tr>

                {/* Architecture */}
                <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 px-4 font-medium text-slate-400">Architecture</td>
                  {modelsData.map((m) => (
                    <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 text-slate-200 font-mono">
                      {m.architecture || "Dense Transformer"}
                    </td>
                  ))}
                </tr>

                {/* Parameters */}
                <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 px-4 font-medium text-slate-400">Parameters Topology</td>
                  {modelsData.map((m) => (
                    <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 text-slate-200 font-mono font-semibold">
                      {m.parametersCount || "Proprietary"}
                    </td>
                  ))}
                </tr>

                {/* Context Window */}
                <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 px-4 font-medium text-slate-400">Context Window</td>
                  {modelsData.map((m) => {
                    const isBest =
                      m.contextWindow && bestMetrics.maxContext && m.contextWindow === bestMetrics.maxContext;
                    return (
                      <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">
                            {formatTokenCount(m.contextWindow || 0)}
                          </span>
                          {isBest && (
                            <Badge variant="success" size="sm" className="text-[10px] py-0 px-1.5 font-sans">
                              Largest
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {(m.contextWindow || 0).toLocaleString()} tokens
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* License & Weights */}
                <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 px-4 font-medium text-slate-400">License Terms</td>
                  {modelsData.map((m) => (
                    <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 text-slate-300">
                      <span className="font-medium text-slate-200">{m.license || "Proprietary"}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {m.openWeights ? "Weights accessible under permissive terms" : "Hosted commercial API only"}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Release Date */}
                <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 px-4 font-medium text-slate-400">Release Date</td>
                  {modelsData.map((m) => (
                    <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 font-mono text-slate-300">
                      {m.releaseDate ? m.releaseDate.split("T")[0] : "2024"}
                    </td>
                  ))}
                </tr>

                {/* SECTION 2: UNIT ECONOMICS & PRICING */}
                <tr className="bg-slate-950/60 border-t border-b border-slate-800">
                  <td
                    colSpan={modelsData.length + 1}
                    className="p-3 px-4 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2"
                  >
                    <Icons.BarChart className="h-4 w-4" />
                    <span>Unit Economic Pricing (USD per 1 Million Tokens)</span>
                  </td>
                </tr>

                {/* Input Price */}
                <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 px-4 font-medium text-slate-400">Input Price / 1M</td>
                  {modelsData.map((m) => {
                    const price = m.openWeights ? 0 : m.inputPricePerMillion;
                    const isLowest =
                      price !== null && bestMetrics.minInput !== null && price === bestMetrics.minInput;
                    return (
                      <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              m.openWeights ? "text-emerald-400" : "text-slate-100"
                            }`}
                          >
                            {formatPrice(m.inputPricePerMillion, m.openWeights)}
                          </span>
                          {isLowest && (
                            <Badge variant="success" size="sm" className="text-[10px] py-0 px-1.5 font-sans">
                              Lowest
                            </Badge>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Output Price */}
                <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 px-4 font-medium text-slate-400">Output Price / 1M</td>
                  {modelsData.map((m) => {
                    const price = m.openWeights ? 0 : m.outputPricePerMillion;
                    const isLowest =
                      price !== null && bestMetrics.minOutput !== null && price === bestMetrics.minOutput;
                    return (
                      <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              m.openWeights ? "text-emerald-400" : "text-sky-300"
                            }`}
                          >
                            {formatPrice(m.outputPricePerMillion, m.openWeights)}
                          </span>
                          {isLowest && (
                            <Badge variant="success" size="sm" className="text-[10px] py-0 px-1.5 font-sans">
                              Lowest
                            </Badge>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Blended 3:1 Input/Output Estimate */}
                <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 px-4 font-medium text-slate-400">
                    Est. Query Cost
                    <span className="text-[10px] text-slate-500 block">(10K in / 2K out)</span>
                  </td>
                  {modelsData.map((m) => {
                    if (m.openWeights) {
                      return (
                        <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 font-mono text-emerald-400">
                          $0.00 (Self-Host)
                        </td>
                      );
                    }
                    const inCost = ((m.inputPricePerMillion || 0) * 10000) / 1000000;
                    const outCost = ((m.outputPricePerMillion || 0) * 2000) / 1000000;
                    const total = inCost + outCost;
                    return (
                      <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 font-mono text-slate-200">
                        ${total.toFixed(4)}
                      </td>
                    );
                  })}
                </tr>

                {/* SECTION 3: STANDARDIZED BENCHMARK EVALUATIONS */}
                <tr className="bg-slate-950/60 border-t border-b border-slate-800">
                  <td
                    colSpan={modelsData.length + 1}
                    className="p-3 px-4 font-mono text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2"
                  >
                    <Icons.BarChart className="h-4 w-4" />
                    <span>Reproducible Benchmark Evaluations (Verified vs Synthetic)</span>
                  </td>
                </tr>

                {allBenchmarkNames.map((benchmarkName) => {
                  return (
                    <tr
                      key={benchmarkName}
                      className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="p-3.5 px-4 font-medium text-slate-300">
                        <span>{benchmarkName}</span>
                      </td>

                      {modelsData.map((m) => {
                        const rec = m.benchmarks.find((b) => b.name === benchmarkName);
                        if (!rec || rec.score === null || rec.score === undefined) {
                          return (
                            <td
                              key={m.slug}
                              className="p-3.5 px-4 border-l border-slate-800/60 text-slate-500 font-mono"
                            >
                              <span className="italic">Not Evaluated</span>
                            </td>
                          );
                        }

                        const isTop =
                          bestMetrics.bestScores[benchmarkName] !== undefined &&
                          rec.score === bestMetrics.bestScores[benchmarkName];

                        const formattedScore =
                          rec.maxScore <= 100 ? `${rec.score}%` : `${Math.round(rec.score)} ELO`;

                        return (
                          <td key={m.slug} className="p-3.5 px-4 border-l border-slate-800/60 font-mono">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-bold ${
                                  isTop ? "text-emerald-400 font-extrabold" : "text-slate-100"
                                }`}
                              >
                                {formattedScore}
                              </span>
                              {isTop && (
                                <Badge variant="success" size="sm" className="text-[10px] py-0 px-1 font-sans">
                                  Top Score
                                </Badge>
                              )}
                            </div>

                            {/* Provenance Badge */}
                            <div className="mt-1">
                              {rec.isVerified ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-sans text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/40">
                                  <Icons.CheckCircle className="h-2.5 w-2.5" />
                                  <span>Verified LMSYS/Lab</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-sans text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/40">
                                  <span>Estimated / Baseline</span>
                                </span>
                              )}
                            </div>

                            {rec.notes && (
                              <p className="text-[10px] font-sans text-slate-400 mt-1 line-clamp-1">
                                {rec.notes}
                              </p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Trade-off Verdict & Takeaways Banner */}
          <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-sky-950/20 p-6 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Icons.Sparkles className="h-4 w-4 text-sky-400" />
              <span>Comparative Engineering Takeaways</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <span className="font-semibold text-emerald-400 block font-mono text-[11px] uppercase">
                  Best Unit Economics
                </span>
                <p className="text-slate-300">
                  {modelsData.some((m) => m.openWeights)
                    ? "Open-weight models (e.g. DeepSeek, Llama) offer zero vendor token margins for self-hosted GPU clusters."
                    : `Lowest inference cost: ${modelsData[0].name} at ${formatPrice(bestMetrics.minInput, false)}.`}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <span className="font-semibold text-sky-400 block font-mono text-[11px] uppercase">
                  Long-Context Capacity
                </span>
                <p className="text-slate-300">
                  {bestMetrics.maxContext
                    ? `Top capacity reaches ${formatTokenCount(bestMetrics.maxContext)} (${bestMetrics.maxContext.toLocaleString()} tokens).`
                    : "Standard 128K context window coverage across all selected models."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <span className="font-semibold text-purple-400 block font-mono text-[11px] uppercase">
                  Audit Provenance Guarantee
                </span>
                <p className="text-slate-300">
                  Benchmark scores are explicitly categorized as verified LMSYS/Vendor records or estimated comparison baselines.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading comparison matrix...
        </div>
      }
    >
      <CompareContent />
    </React.Suspense>
  );
}
