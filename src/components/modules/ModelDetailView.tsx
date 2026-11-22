"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModelDetailItem } from "@/types";
import { useComparison } from "@/context/ComparisonContext";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatTokenCount,
  formatPrice,
  parseParameterTopology,
  formatModelDate,
} from "@/lib/utils";

// Standard OneAtlas Benchmark Suites definition for honest non-evaluated tracking
const ALL_STANDARD_BENCHMARKS = [
  { slug: "arena-elo", name: "Chatbot Arena ELO", category: "Human Preference", unit: "ELO" },
  { slug: "mmlu-pro", name: "MMLU-Pro", category: "Reasoning & Knowledge", unit: "%" },
  { slug: "mmlu", name: "MMLU", category: "Knowledge & Understanding", unit: "%" },
  { slug: "humaneval", name: "HumanEval", category: "Code Synthesis", unit: "%" },
  { slug: "swe-bench", name: "SWE-bench Verified", category: "Software Engineering", unit: "%" },
  { slug: "gsm8k", name: "GSM8K", category: "Math & Word Problems", unit: "%" },
  { slug: "math-500", name: "MATH-500", category: "Advanced Mathematics", unit: "%" },
];

interface ModelDetailViewProps {
  slug: string;
}

export function ModelDetailView({ slug }: ModelDetailViewProps) {
  const router = useRouter();
  const { isModelSelected, toggleModel, selectedModels } = useComparison();

  const [model, setModel] = React.useState<ModelDetailItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<{ code?: string; message: string } | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Interactive Cost Calculator state
  const [calcInputTokens, setCalcInputTokens] = React.useState<number>(100_000);
  const [calcOutputTokens, setCalcOutputTokens] = React.useState<number>(10_000);

  // Fetch model details from GET /api/models/[slug]
  React.useEffect(() => {
    let isCancelled = false;

    async function executeFetch() {
      try {
        const res = await fetch(`/api/models/${encodeURIComponent(slug)}`);
        const json = await res.json();

        if (isCancelled) return;

        if (!res.ok || !json.success) {
          if (res.status === 404 || json.error?.code === "MODEL_NOT_FOUND") {
            setError({
              code: "MODEL_NOT_FOUND",
              message: json.error?.message || `Model with slug '${slug}' was not found in the registry.`,
            });
          } else {
            setError({
              code: json.error?.code || "FETCH_ERROR",
              message: json.error?.message || `Failed to retrieve model intelligence for '${slug}' (HTTP ${res.status}).`,
            });
          }
          setModel(null);
        } else {
          setModel(json.data);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("[OneAtlas] Failed to fetch model details:", err);
          setError({
            code: "NETWORK_ERROR",
            message: err instanceof Error ? err.message : "Failed to connect to OneAtlas model registry.",
          });
          setModel(null);
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

  // Calculate simulated query cost (must be unconditional hook)
  const calculatedCostUSD = React.useMemo(() => {
    if (!model) return null;
    if (model.openWeights) return 0;
    if (model.inputPricePerMillion === null && model.outputPricePerMillion === null) {
      return null;
    }
    const inPrice = model.inputPricePerMillion || 0;
    const outPrice = model.outputPricePerMillion || 0;
    const inputCost = (calcInputTokens / 1_000_000) * inPrice;
    const outputCost = (calcOutputTokens / 1_000_000) * outPrice;
    return inputCost + outputCost;
  }, [model, calcInputTokens, calcOutputTokens]);

  // Derived Modalities list based on categories and metadata (must be unconditional hook)
  const supportedModalities = React.useMemo(() => {
    if (!model) return [];
    const modalities: string[] = ["Text Generation", "Natural Language Understanding"];
    const hasMultimodal = model.categories.some((c) => c.slug === "multimodal-vision");
    const hasCode = model.categories.some((c) => c.slug === "code-generation");
    const hasReasoning = model.categories.some((c) => c.slug === "reasoning-math");

    if (hasMultimodal || model.architecture?.toLowerCase().includes("multimodal")) {
      modalities.push("Vision & Interleaved Image Tokens");
    }
    if (hasCode) {
      modalities.push("Source Code & Repository Synthesis");
    }
    if (hasReasoning) {
      modalities.push("Chain-of-Thought Algorithmic Reasoning");
    }
    modalities.push("Structured JSON & Tool Calling");
    return modalities;
  }, [model]);

  // Loading skeleton state
  if (isLoading) {
    return <ModelDetailSkeleton />;
  }

  // Not Found (404) state
  if (error?.code === "MODEL_NOT_FOUND") {
    return (
      <div className="py-16 text-center max-w-xl mx-auto space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Icons.AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="warning" size="md">
            404 — Model Not Found
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Unknown Foundation Model
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The model slug <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300 font-mono text-xs">{slug}</code> could not be found in the OneAtlas database registry.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button
            variant="primary"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <Icons.ArrowLeft className="h-4 w-4" />
            <span>Return to Discovery</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/leaderboard")}
            className="flex items-center gap-2"
          >
            <Icons.BarChart className="h-4 w-4" />
            <span>Browse Leaderboard</span>
          </Button>
        </div>
      </div>
    );
  }

  // Generic Error State
  if (error || !model) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 space-y-2">
          <div className="flex items-center justify-center gap-2 font-semibold">
            <Icons.AlertCircle className="h-5 w-5 text-red-400" />
            <span>Failed to Load Model Details</span>
          </div>
          <p className="text-xs text-red-200/80">{error?.message || "An unexpected error occurred."}</p>
        </div>
        <Button variant="primary" onClick={handleRetry} className="mx-auto">
          Retry Request
        </Button>
      </div>
    );
  }

  // Derived Specifications
  const isSelected = isModelSelected(model.slug);
  const topology = parseParameterTopology(model.parametersCount, model.architecture);
  const formattedReleaseDate = formatModelDate(model.releaseDate);

  // Check if pricing is published or missing
  const hasPricingData =
    model.openWeights ||
    (model.inputPricePerMillion !== null && model.outputPricePerMillion !== null);

  // Map evaluated vs non-evaluated benchmarks
  const evaluatedBenchmarkSlugs = new Set(model.benchmarks.map((b) => b.slug));
  const unEvaluatedBenchmarks = ALL_STANDARD_BENCHMARKS.filter(
    (b) => !evaluatedBenchmarkSlugs.has(b.slug)
  );

  // Comparison handler
  const handleToggleCompare = () => {
    toggleModel({
      id: model.id,
      slug: model.slug,
      name: model.name,
      provider: {
        name: model.provider.name,
        slug: model.provider.slug,
      },
      category: model.categories[0]?.name || "General LLM",
      inputPricePerMillion: model.inputPricePerMillion,
      outputPricePerMillion: model.outputPricePerMillion,
      contextWindow: model.contextWindow ?? undefined,
      parametersCount: model.parametersCount ?? undefined,
      openWeights: model.openWeights,
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
          <span className="text-slate-400">Models</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-100 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {model.name}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Icons.ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Discovery</span>
          </Link>

          <Button
            variant={isSelected ? "primary" : "secondary"}
            size="sm"
            onClick={handleToggleCompare}
            className={`gap-1.5 cursor-pointer text-xs ${
              isSelected
                ? "bg-sky-600 hover:bg-sky-500 text-white shadow-sm ring-1 ring-sky-400/40"
                : ""
            }`}
          >
            {isSelected ? (
              <>
                <Icons.Check className="h-3.5 w-3.5" />
                <span>Selected in Tray</span>
              </>
            ) : (
              <>
                <Icons.Scale className="h-3.5 w-3.5" />
                <span>Add to Compare</span>
              </>
            )}
          </Button>

          <Link
            href={
              selectedModels.length > 0 && selectedModels.some((m) => m.slug === model.slug)
                ? `/compare?models=${selectedModels.map((m) => m.slug).join(",")}`
                : `/compare?models=${model.slug}`
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all"
          >
            <span>Compare Matrix</span>
            <Icons.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Hero Header & Identity Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Provider row and Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/providers/${encodeURIComponent(model.provider.slug)}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors group"
              title={`View ${model.provider.name} intelligence dossier`}
            >
              <div className="h-5 w-5 rounded-md bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center font-mono">
                {model.provider.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold group-hover:text-sky-300 transition-colors">
                {model.provider.name}
              </span>
              {model.provider.isVerified && (
                <Icons.CheckCircle className="h-3.5 w-3.5 text-sky-400" />
              )}
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={model.openWeights ? "success" : "purple"}
                size="md"
                className="font-mono text-xs"
              >
                {model.openWeights ? "Open Weights" : "Proprietary Commercial"}
              </Badge>
              <Badge variant="outline" size="md" className="font-mono text-xs text-slate-300">
                {model.license || "Proprietary"}
              </Badge>
              {model.status && (
                <Badge variant={model.status === "ACTIVE" ? "info" : "warning"} size="sm">
                  {model.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Model Name and Tagline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              {model.name}
            </h1>
            {model.tagline && (
              <p className="text-base sm:text-lg text-slate-300 font-medium max-w-3xl leading-relaxed">
                {model.tagline}
              </p>
            )}
          </div>

          {/* Model Description */}
          {model.description && (
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed border-l-2 border-sky-500/40 pl-4 py-0.5">
              {model.description}
            </p>
          )}

          {/* Taxonomy Categories & External Links */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Categories:</span>
              {model.categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/?category=${encodeURIComponent(c.slug)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-sky-300 border border-slate-700/50 transition-colors"
                >
                  <Icons.Tag className="h-3 w-3 text-sky-400" />
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {model.documentationUrl && (
                <a
                  href={model.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
                >
                  <Icons.BookOpen className="h-3.5 w-3.5" />
                  <span>Documentation</span>
                  <Icons.ExternalLink className="h-3 w-3" />
                </a>
              )}
              {model.huggingFaceUrl && (
                <a
                  href={model.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
                >
                  <Icons.Cpu className="h-3.5 w-3.5" />
                  <span>HuggingFace Hub</span>
                  <Icons.ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hardware & Architecture Specifications Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200 tracking-wide uppercase">
          <Icons.Cpu className="h-4 w-4 text-sky-400" />
          <span>Architecture & Hardware Topology</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Parameters */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider">Total Parameters</span>
              <Icons.Layers className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                {topology.total}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {topology.isMoE ? "Total weights across all experts" : "Dense weight parameter count"}
              </p>
            </div>
          </div>

          {/* Active Parameters */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider">Active Parameters</span>
              <Icons.Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-black font-mono text-indigo-300 tracking-tight">
                {topology.active}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {topology.isMoE
                  ? "Dynamic sparse routing per forward pass"
                  : "All weights activated per token"}
              </p>
            </div>
          </div>

          {/* Context Window */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider">Context Window</span>
              <Icons.Database className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                {formatTokenCount(model.contextWindow)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {model.contextWindow
                  ? `~${Math.round((model.contextWindow * 0.75) / 1000)}k words (~${Math.round(
                      (model.contextWindow * 0.75) / 300
                    )} pages)`
                  : "Context capacity undisclosed"}
              </p>
            </div>
          </div>

          {/* Release Date */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider">Release Date</span>
              <Icons.Calendar className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100 tracking-tight">
                {formattedReleaseDate}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Architecture: {model.architecture || "Dense Transformer"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Supported Modalities & Capabilities */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Icons.Sliders className="h-4 w-4 text-sky-400" />
          <span>Supported Modalities & Inference Capabilities</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {supportedModalities.map((modality) => (
            <div
              key={modality}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-800 bg-slate-950/80 text-xs font-medium text-slate-300"
            >
              <Icons.CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>{modality}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Unit Economics & Token Pricing Architecture */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 tracking-wide uppercase">
            <Icons.DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Unit Economics & API Pricing Architecture</span>
          </div>
          {model.openWeights && (
            <Badge variant="success" size="sm">
              Zero Direct License Cost
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Price Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Input Tokens (Prompt Ingestion)</span>
              <span className="font-mono text-[10px] text-slate-500">Per 1,000,000 Tokens</span>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {formatPrice(model.inputPricePerMillion, model.openWeights)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {model.openWeights
                ? "Self-hostable without per-token licensing fees on sovereign infrastructure."
                : model.inputPricePerMillion !== null
                ? `Vendor standard commercial API ingestion rate at $${model.inputPricePerMillion?.toFixed(
                    3
                  )} per 1M tokens.`
                : "Pricing not published publicly. Inquire with provider for enterprise access."}
            </p>
          </div>

          {/* Output Price Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Output Tokens (Generation / Synthesis)</span>
              <span className="font-mono text-[10px] text-slate-500">Per 1,000,000 Tokens</span>
            </div>
            <div className="text-3xl font-black font-mono text-sky-400">
              {formatPrice(model.outputPricePerMillion, model.openWeights)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {model.openWeights
                ? "Compute bounded by target cluster throughput (e.g. vLLM, SGLang, TensorRT-LLM)."
                : model.outputPricePerMillion !== null
                ? `Vendor standard generation synthesis rate at $${model.outputPricePerMillion?.toFixed(
                    3
                  )} per 1M tokens.`
                : "Custom commercial agreement required for API deployment."}
            </p>
          </div>
        </div>

        {/* Missing Pricing Honest Notice if neither pricing field is available and closed */}
        {!hasPricingData && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 flex items-start gap-3 text-amber-200 text-xs">
            <Icons.AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-300">Commercial Pricing Not Publicly Disclosed</span>
              OneAtlas maintains zero-fabrication reporting. Because this model does not provide public per-token API pricing, rates are listed as custom rather than estimated.
            </div>
          </div>
        )}

        {/* Interactive Query Cost Simulator */}
        <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Icons.Sliders className="h-3.5 w-3.5 text-sky-400" />
                <span>Workload Cost Simulator</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Simulate real-world API invoice costs for batch and conversational workloads.
              </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setCalcInputTokens(2_000);
                  setCalcOutputTokens(500);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Chat (2K/500)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalcInputTokens(32_000);
                  setCalcOutputTokens(2_000);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                RAG (32K/2K)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalcInputTokens(100_000);
                  setCalcOutputTokens(10_000);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Agent (100K/10K)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalcInputTokens(1_000_000);
                  setCalcOutputTokens(100_000);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Batch (1M/100K)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Input tokens field */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Prompt Tokens</span>
                <span className="font-mono text-sky-400">{calcInputTokens.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="1000"
                max="2000000"
                step="5000"
                value={calcInputTokens}
                onChange={(e) => setCalcInputTokens(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Output tokens field */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Completion Tokens</span>
                <span className="font-mono text-sky-400">{calcOutputTokens.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="500"
                max="200000"
                step="1000"
                value={calcOutputTokens}
                onChange={(e) => setCalcOutputTokens(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Estimated Total */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Estimated Workload Cost
              </div>
              <div className="text-xl font-black font-mono text-emerald-400">
                {model.openWeights
                  ? "$0.00 (Self-Hosted)"
                  : calculatedCostUSD !== null
                  ? `$${calculatedCostUSD.toFixed(4)}`
                  : "Contact Vendor"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Standardized Benchmark Evaluations & Audit Provenance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 tracking-wide uppercase">
            <Icons.BarChart className="h-4 w-4 text-sky-400" />
            <span>Standardized Benchmark Evaluations</span>
          </div>
          <Link
            href="/leaderboard"
            className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>View Full Leaderboard</span>
            <Icons.ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {model.benchmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {model.benchmarks.map((bench) => {
              const isElo = bench.slug === "arena-elo" || bench.maxScore > 100;
              const formattedScore = isElo
                ? `${Math.round(bench.score)} ELO`
                : `${bench.score.toFixed(1)}%`;
              const fillPercentage = isElo
                ? Math.min(100, Math.max(0, ((bench.score - 1000) / 400) * 100))
                : Math.min(100, (bench.score / bench.maxScore) * 100);

              return (
                <div
                  key={bench.id || bench.slug}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{bench.name}</h4>
                        <Badge
                          variant={bench.isVerified ? "success" : "warning"}
                          size="sm"
                          className="text-[10px] font-mono"
                        >
                          {bench.isVerified ? "Verified LMSYS/Lab" : "Estimated Baseline"}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">{bench.category}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-sky-400">
                        {formattedScore}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Max: {bench.maxScore}
                      </span>
                    </div>
                  </div>

                  {/* Visual score bar */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>

                  {/* Notes / Citations */}
                  {bench.notes && (
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                      <Icons.ShieldCheck className="h-3 w-3 text-sky-400 shrink-0" />
                      <span className="truncate">{bench.notes}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-400 text-xs">
            No standardized benchmark scores currently registered for this model.
          </div>
        )}

        {/* Non-evaluated benchmarks transparency card */}
        {unEvaluatedBenchmarks.length > 0 && (
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Icons.AlertCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Un-Evaluated Benchmark Suites ({unEvaluatedBenchmarks.length} of {ALL_STANDARD_BENCHMARKS.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In accordance with OneAtlas data integrity guidelines, un-evaluated suites are not populated with synthetic averages or estimates:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {unEvaluatedBenchmarks.map((b) => (
                <div
                  key={b.slug}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-800/80 bg-slate-900/50 text-xs text-slate-400"
                >
                  <span className="font-medium text-slate-300">{b.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">(Not Evaluated)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. Provider & Research Lab Dossier */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 text-sky-400 font-bold text-lg flex items-center justify-center font-mono shadow-inner">
              {model.provider.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{model.provider.name}</h3>
                {model.provider.isVerified && (
                  <Badge variant="info" size="sm" className="gap-1">
                    <Icons.CheckCircle className="h-3 w-3 text-sky-400" />
                    <span>Verified Lab</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {model.provider.description || "Frontier artificial intelligence research laboratory."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {model.provider.websiteUrl && (
              <a
                href={model.provider.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
              >
                <Icons.Globe className="h-3.5 w-3.5 text-sky-400" />
                <span>Lab Website</span>
                <Icons.ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Link
              href={`/providers/${encodeURIComponent(model.provider.slug)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Explore Lab Models</span>
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 8. Bottom Direct Comparison CTA */}
      <div className="p-6 rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-950/30 via-slate-900 to-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white tracking-tight">
            Compare {model.name} Side-by-Side
          </h4>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Evaluate architectural trade-offs, pricing economics, and benchmark performance across competing foundation models in the matrix.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={isSelected ? "primary" : "secondary"}
            size="md"
            onClick={handleToggleCompare}
            className="text-xs font-semibold gap-1.5"
          >
            <Icons.Scale className="h-3.5 w-3.5" />
            <span>{isSelected ? "Remove from Tray" : "Add to Comparison"}</span>
          </Button>

          <Link
            href={`/compare?models=${model.slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <span>Compare Now</span>
            <Icons.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton state for Model Detail View
 */
function ModelDetailSkeleton() {
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
      <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-7 w-32 bg-slate-800 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-slate-800 rounded" />
            <div className="h-6 w-20 bg-slate-800 rounded" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-10 w-72 bg-slate-800 rounded-lg" />
          <div className="h-5 w-96 bg-slate-800/70 rounded" />
        </div>

        <div className="h-16 w-full max-w-2xl bg-slate-800/40 rounded-lg" />
      </div>

      {/* 4 Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-8 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-40 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Pricing Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-10 w-40 bg-slate-800 rounded" />
        </div>
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-10 w-40 bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  );
}
