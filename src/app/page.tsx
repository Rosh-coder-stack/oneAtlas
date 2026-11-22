import * as React from "react";
import { getModels } from "@/services/model.service";
import { prisma } from "@/lib/prisma";
import { AIModel, IntelligenceMetric, ModelCategoryType } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { ModelDiscoveryExplorer } from "@/components/modules/ModelDiscoveryExplorer";
import { BenchmarkOverview } from "@/components/modules/BenchmarkOverview";
import { Badge } from "@/components/ui/Badge";
import { Icons } from "@/components/ui/Icons";

export const instant = false;

export default async function HomePage() {
  // Query source of truth directly from PostgreSQL database via service layer
  let models: AIModel[] = [];
  let modelCount = 0;
  let providerCount = 0;
  let benchmarkCount = 0;

  try {
    const [modelsResult, totalModels, totalProviders, totalBenchmarks] = await Promise.all([
      getModels({ limit: 50, sortBy: "created_at", sortOrder: "desc" }),
      prisma.model.count(),
      prisma.provider.count(),
      prisma.benchmark.count(),
    ]);

    modelCount = totalModels;
    providerCount = totalProviders;
    benchmarkCount = totalBenchmarks;

    models = modelsResult.models.map((m) => {
      const primaryCategory = (m.categories[0]?.name as ModelCategoryType) || "General LLM";
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        tagline: m.tagline || "",
        description: m.description || "",
        provider: {
          id: m.provider.id,
          name: m.provider.name,
          slug: m.provider.slug,
          logoUrl: m.provider.logoUrl || undefined,
          verified: m.provider.isVerified,
        },
        category: primaryCategory,
        architecture: m.architecture || "Dense Transformer",
        parametersCount: m.parametersCount || "Proprietary",
        contextWindow: m.contextWindow || 128000,
        license: m.license || "Proprietary",
        licenseType: m.openWeights ? "Open Weights" : "Proprietary",
        openWeights: m.openWeights,
        releaseDate: m.releaseDate ? m.releaseDate.toISOString().split("T")[0] : "2024-01-01",
        isFeatured: m.isFeatured,
        inputPricePerMillion: m.inputPricePerMillion,
        outputPricePerMillion: m.outputPricePerMillion,
        badges: [
          m.openWeights ? "Open Weights" : "Proprietary API",
          ...(m.parametersCount ? [m.parametersCount] : []),
          ...(m.contextWindow ? [`${Math.round(m.contextWindow / 1000)}K Context`] : []),
        ],
        benchmarks: m.benchmarks.map((b) => ({
          benchmarkId: b.benchmarkId,
          name: b.name,
          score: b.score,
          maxScore: b.maxScore,
          category: (b.category as "Reasoning" | "Coding" | "Knowledge" | "Safety" | "Vision") || "Knowledge",
          sourceUrl: undefined,
        })),
      };
    });
  } catch (error) {
    console.error("Failed to load initial models from database:", error);
  }

  const liveMetrics: IntelligenceMetric[] = [
    {
      title: "Cataloged Models",
      value: `${modelCount} Active`,
      change: "Live DB",
      trend: "up",
      description: "Frontier & open-weight model architectures synced in PostgreSQL",
    },
    {
      title: "Standardized Benchmarks",
      value: `${benchmarkCount} Suites`,
      change: "MMLU, SWE-bench",
      trend: "neutral",
      description: "Rigorous synthetic & human-verified evaluations",
    },
    {
      title: "Active Model Providers",
      value: `${providerCount} Labs`,
      change: "OpenAI, Anthropic, Meta...",
      trend: "up",
      description: "From research institutions to enterprise labs",
    },
    {
      title: "Architecture Trends",
      value: "MoE & RL",
      change: "Efficiency shift",
      trend: "up",
      description: "DeepSeek, Gemini, and Llama architectures cataloged",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative pt-4 pb-2">
        <div className="flex flex-col items-start gap-4">
          <Badge variant="info" size="md" className="gap-1.5 py-1 px-3">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            OneAtlas Registry &bull; Frontier & Open Weights Intelligence
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            Discover, Compare & Benchmark{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              Frontier AI Models
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            The high-performance discovery platform for neural architectures, open-weight foundation models,
            and reproducible benchmark evaluations across reasoning, coding, and math.
          </p>
        </div>

        {/* Global Intelligence Metrics */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveMetrics.map((metric, idx) => (
            <StatCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              description={metric.description}
              icon={
                idx === 0 ? (
                  <Icons.Cpu className="h-4 w-4" />
                ) : idx === 1 ? (
                  <Icons.BarChart className="h-4 w-4" />
                ) : idx === 2 ? (
                  <Icons.Building className="h-4 w-4" />
                ) : (
                  <Icons.Layers className="h-4 w-4" />
                )
              }
            />
          ))}
        </div>
      </section>

      {/* Model Catalog & Discovery Section */}
      <section id="catalog" className="space-y-6 scroll-mt-20">
        <div id="providers" className="scroll-mt-20" />
        <div id="arena" className="scroll-mt-20" />
        <div id="docs" className="scroll-mt-20" />
        <div id="config" className="scroll-mt-20" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Icons.Cpu className="h-5 w-5 text-sky-400" />
              Foundation Model Catalog
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Explore parameter topologies, context windows, and verified benchmark metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">
              Live Database Active
            </Badge>
          </div>
        </div>

        <ModelDiscoveryExplorer initialModels={models} />
      </section>

      {/* Standardized Benchmark Evaluations */}
      <BenchmarkOverview />

      {/* PostgreSQL & Prisma Ready Architecture Banner */}
      <section id="database" className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-sky-950/20 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Icons.Database className="h-5 w-5 text-sky-400" />
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider font-mono">
                PostgreSQL & Prisma Layer
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Relational Intelligence Schema Active
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              OneAtlas is running on a live PostgreSQL 16 container via Docker Compose.
              The database is seeded with <strong className="text-slate-200">{modelCount} AI models</strong> across{" "}
              <strong className="text-slate-200">{providerCount} providers</strong>,{" "}
              <strong className="text-slate-200">5 categories</strong>, and{" "}
              <strong className="text-slate-200">{benchmarkCount} benchmark suites</strong> with relational integrity and cascade rules.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" size="sm" className="font-mono">
                PostgreSQL 16 (127.0.0.1:5432)
              </Badge>
              <Badge variant="outline" size="sm" className="font-mono">
                Prisma Client v6.19.3
              </Badge>
              <Badge variant="outline" size="sm" className="font-mono">
                REST APIs: /api/models
              </Badge>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs text-slate-300 w-full lg:w-auto min-w-[280px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-slate-400 text-[10px] uppercase">Database Status</span>
              <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Connected
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mb-2">
              Query models via REST API:
            </p>
            <pre className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 overflow-x-auto mb-2 border border-slate-800/60">
              <code>GET /api/models?sortBy=input_price</code>
            </pre>
            <p className="text-[10px] text-slate-400">
              Full search, pagination, and multi-field sorting enabled.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
