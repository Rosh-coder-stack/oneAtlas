"use client";

import * as React from "react";
import Link from "next/link";
import { AIModel } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { formatTokenCount, formatPrice } from "@/lib/utils";
import { useComparison } from "@/context/ComparisonContext";

interface ModelCardProps {
  model: AIModel;
}

export function ModelCard({ model }: ModelCardProps) {
  const { isModelSelected, toggleModel } = useComparison();
  const isSelected = isModelSelected(model.slug);

  const handleToggleComparison = () => {
    toggleModel({
      id: model.id,
      slug: model.slug,
      name: model.name,
      provider: {
        name: model.provider.name,
        slug: model.provider.slug,
      },
      category: model.category,
      inputPricePerMillion: model.inputPricePerMillion,
      outputPricePerMillion: model.outputPricePerMillion,
      contextWindow: model.contextWindow,
      parametersCount: model.parametersCount,
      openWeights: model.openWeights,
    });
  };

  return (
    <Card
      className={`flex flex-col justify-between transition-all duration-200 group relative ${
        isSelected
          ? "border-sky-500/70 bg-slate-900/95 ring-1 ring-sky-500/30 shadow-lg shadow-sky-500/5"
          : "hover:border-slate-700/80 hover:bg-slate-900/90"
      }`}
    >
      <div>
        <CardHeader className="pb-3">
          {/* Provider & Open Weights indicator */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-300">
                {model.provider.name}
              </span>
              {model.provider.verified && (
                <Icons.CheckCircle className="h-3.5 w-3.5 text-sky-400" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isSelected && (
                <Badge variant="info" size="sm" className="gap-1 bg-sky-950 text-sky-300 border-sky-700/60 font-mono text-[10px]">
                  <Icons.Check className="h-2.5 w-2.5" />
                  In Tray
                </Badge>
              )}
              <Badge
                variant={model.openWeights ? "success" : "purple"}
                size="sm"
              >
                {model.licenseType}
              </Badge>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl group-hover:text-sky-400 transition-colors">
              <Link href={`/models/${model.slug}`} className="hover:underline">
                {model.name}
              </Link>
            </CardTitle>
          </div>

          <CardDescription className="line-clamp-2 mt-1">
            {model.tagline}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Hardware & Context Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">
                Parameters
              </span>
              <span className="text-slate-200 font-semibold truncate block">
                {model.parametersCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">
                Context
              </span>
              <span className="text-slate-200 font-semibold truncate block">
                {formatTokenCount(model.contextWindow)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">
                Input / 1M
              </span>
              <span className="text-emerald-400 font-semibold truncate block">
                {formatPrice(model.inputPricePerMillion, model.openWeights)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">
                Output / 1M
              </span>
              <span className="text-sky-300 font-semibold truncate block">
                {formatPrice(model.outputPricePerMillion, model.openWeights)}
              </span>
            </div>
          </div>

          {/* Benchmark Highlights */}
          {model.benchmarks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Verified Benchmarks</span>
                <span className="font-mono text-[10px]">Score / Max</span>
              </div>
              <div className="space-y-1.5">
                {model.benchmarks.slice(0, 3).map((bench) => (
                  <div key={bench.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        {bench.name}
                      </span>
                      <span className="font-mono text-sky-400 font-semibold">
                        {bench.score}%
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(bench.score, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges / Architecture tags */}
          {model.badges && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {model.badges.map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
          {model.architecture}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant={isSelected ? "primary" : "ghost"}
            size="sm"
            className={`px-2.5 transition-all cursor-pointer flex items-center gap-1 ${
              isSelected
                ? "bg-sky-600 hover:bg-sky-500 text-white shadow-sm ring-1 ring-sky-400/40"
                : "text-slate-300 hover:text-sky-300 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-800/60"
            }`}
            onClick={handleToggleComparison}
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
            href={`/models/${model.slug}`}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <span>Intel</span>
            <Icons.ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
