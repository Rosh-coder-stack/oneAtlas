"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useComparison } from "@/context/ComparisonContext";
import { Icons } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export function ComparisonTray() {
  const {
    selectedModels,
    removeModel,
    clearAll,
    maxLimit,
    minLimit,
    warningMessage,
    clearWarning,
  } = useComparison();

  const pathname = usePathname();
  const isComparePage = pathname === "/compare";

  // Hide tray if no models selected
  if (selectedModels.length === 0) {
    return null;
  }

  const canCompare = selectedModels.length >= minLimit;
  const compareHref = `/compare?models=${selectedModels.map((m) => m.slug).join(",")}`;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Warning Alert Banner (e.g. max limit reached) */}
      {warningMessage && (
        <div className="mb-2 p-2.5 px-4 bg-amber-950/90 border border-amber-600/60 rounded-xl text-amber-200 text-xs flex items-center justify-between shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Icons.AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearWarning}
            className="text-amber-300 hover:text-white p-1"
            aria-label="Dismiss warning"
          >
            <Icons.Close className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Tray Container */}
      <div className="bg-slate-900/95 border border-sky-500/30 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 ring-1 ring-sky-500/10">
        {/* Left: Counter & Model Chips */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
              <span>Comparison Tray</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-300">
                {selectedModels.length}/{maxLimit}
              </span>
            </span>
          </div>

          {/* Model Chips List */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-20 overflow-y-auto">
            {selectedModels.map((model) => (
              <span
                key={model.slug}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-xs rounded-lg bg-slate-950/90 border border-slate-700/80 text-slate-200 group hover:border-slate-600 transition-colors"
              >
                <span className="font-medium truncate max-w-[120px] sm:max-w-[150px]">
                  {model.name}
                </span>
                <span className="text-[10px] text-slate-400 hidden lg:inline">
                  &bull; {model.provider.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeModel(model.slug)}
                  className="text-slate-400 hover:text-rose-400 rounded p-0.5 transition-colors cursor-pointer"
                  title={`Remove ${model.name}`}
                  aria-label={`Remove ${model.name}`}
                >
                  <Icons.Close className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-800/80 pt-2 md:pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-slate-200 py-1.5 px-2.5 h-auto cursor-pointer"
          >
            Clear All
          </Button>

          {isComparePage ? (
            <span className="text-xs font-mono text-sky-400 bg-sky-950/80 border border-sky-800/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Icons.Scale className="h-3.5 w-3.5" />
              Comparing ({selectedModels.length})
            </span>
          ) : (
            <Link
              href={canCompare ? compareHref : "#"}
              aria-disabled={!canCompare}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                canCompare
                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-400 hover:to-indigo-500 shadow-sky-500/20 hover:shadow-sky-500/30 cursor-pointer"
                  : "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/60"
              }`}
            >
              <Icons.Scale className="h-3.5 w-3.5" />
              <span>{canCompare ? "Compare Now" : `Add ${minLimit - selectedModels.length} More`}</span>
              {canCompare && <Icons.ArrowRight className="h-3.5 w-3.5" />}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
