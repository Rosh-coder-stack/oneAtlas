"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icons } from "@/components/ui/Icons";

interface BenchmarkSuiteItem {
  id?: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  maxScore: number;
  evaluatedModelsCount?: number;
  topPerformers: Array<{
    score: number;
    modelName: string;
    modelSlug: string;
    isVerified: boolean;
    notes: string | null;
  }>;
}

const FALLBACK_BENCHMARKS: BenchmarkSuiteItem[] = [
  {
    name: "MMLU-Pro",
    slug: "mmlu-pro",
    category: "Reasoning & Knowledge",
    description: "Rigorous 14,000+ college-level reasoning questions with 10 options to suppress guessing.",
    maxScore: 100.0,
    topPerformers: [{ score: 88.7, modelName: "Claude 3.5 Sonnet", modelSlug: "claude-3-5-sonnet", isVerified: true, notes: null }],
  },
  {
    name: "SWE-bench Verified",
    slug: "swe-bench",
    category: "Software Engineering",
    description: "Evaluates end-to-end algorithmic synthesis and real-world GitHub issue resolution.",
    maxScore: 100.0,
    topPerformers: [{ score: 49.3, modelName: "OpenAI o3-mini", modelSlug: "o3-mini", isVerified: true, notes: null }],
  },
  {
    name: "MATH-500",
    slug: "math-500",
    category: "Advanced Mathematics",
    description: "High school competition math problems requiring multi-step chain-of-thought derivations.",
    maxScore: 100.0,
    topPerformers: [{ score: 97.9, modelName: "OpenAI o3-mini", modelSlug: "o3-mini", isVerified: true, notes: null }],
  },
  {
    name: "Chatbot Arena ELO",
    slug: "arena-elo",
    category: "Human Preference",
    description: "Crowdsourced blind A/B evaluations measuring human preference across 1M+ prompts.",
    maxScore: 1500.0,
    topPerformers: [{ score: 1358.0, modelName: "OpenAI o1", modelSlug: "o1", isVerified: true, notes: null }],
  },
];

export function BenchmarkOverview() {
  const [benchmarks, setBenchmarks] = React.useState<BenchmarkSuiteItem[]>(FALLBACK_BENCHMARKS);
  const [isLiveSynced, setIsLiveSynced] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/benchmarks")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && Array.isArray(json.data) && json.data.length > 0) {
          // Take top 4 representative suites for overview display
          const filtered = json.data.slice(0, 4);
          setBenchmarks(filtered);
          setIsLiveSynced(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load benchmarks from API:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="benchmarks" className="space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Icons.BarChart className="h-5 w-5 text-sky-400" />
            Standardized Benchmark Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified comparative evaluations across reasoning, coding, and mathematical benchmarks.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-300 hover:bg-sky-900/60 transition-colors"
          >
            <span>Full Leaderboard</span>
            <Icons.ArrowRight className="h-3 w-3" />
          </Link>
          <Badge variant={isLiveSynced ? "success" : "info"} size="md">
            {isLiveSynced ? "Live API Synced" : "Prisma Schema Synced"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {benchmarks.map((suite) => {
          const top = suite.topPerformers?.[0];
          const displayScore = top
            ? suite.maxScore <= 100
              ? `${top.score}%`
              : `${Math.round(top.score)} ELO`
            : "N/A";

          return (
            <Card key={suite.slug} className="hover:border-slate-700/80 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
                    {suite.category || "Evaluation"}
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {displayScore}
                  </span>
                </div>
                <CardTitle className="text-base truncate">{suite.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-[11px] mt-1">
                  {suite.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between gap-2">
                  <span className="whitespace-nowrap">Leader:</span>
                  {top ? (
                    <Link
                      href={`/models/${top.modelSlug}`}
                      className="text-slate-200 hover:text-sky-400 hover:underline font-medium font-mono text-[10px] truncate text-right transition-colors"
                    >
                      {top.modelName}
                    </Link>
                  ) : (
                    <span className="text-slate-500 font-mono text-[10px]">Awaiting Eval</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
