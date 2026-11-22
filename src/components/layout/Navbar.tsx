"use client";

import * as React from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSearch } from "@/context/SearchContext";
import { useComparison } from "@/context/ComparisonContext";

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const { searchQuery, setSearchQuery } = useSearch();
  const { selectedModels } = useComparison();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K keyboard shortcut to focus global search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    console.log("[OneAtlas Global Navbar Search] Typed value:", nextVal);
    setSearchQuery(nextVal);
    // Smoothly ensure catalog is in view if typing
    const catalog = document.getElementById("catalog");
    if (catalog) {
      const rect = catalog.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        catalog.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {isSidebarOpen ? (
              <Icons.Close className="h-5 w-5" />
            ) : (
              <Icons.Menu className="h-5 w-5" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <Icons.AtlasOrb className="h-8 w-8 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                OneAtlas
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-800/40">
                  AI INTEL
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                Discovery & Benchmark Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Icons.Search className="h-4 w-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              placeholder="Search AI models, reasoning architectures, benchmarks..."
              className="w-full pl-10 pr-12 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900/60 text-slate-100 placeholder-slate-500 hover:border-slate-700 transition-colors focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                aria-label="Clear global search"
              >
                <Icons.Close className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                <kbd className="hidden lg:inline-block text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  Ctrl K
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-3">
          {selectedModels.length > 0 && (
            <Link
              href={`/compare?models=${selectedModels.map((m) => m.slug).join(",")}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-colors"
            >
              <Icons.Scale className="h-3.5 w-3.5" />
              <span>Compare ({selectedModels.length})</span>
            </Link>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-400 font-medium">PostgreSQL Ready</span>
            </div>
            <Badge variant="outline" size="sm" className="hidden xl:inline-flex text-slate-400">
              Next.js 16 App Router
            </Badge>
          </div>

          <Link
            href="/providers"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-900/60 text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
          >
            <Icons.Building className="h-3.5 w-3.5 text-sky-400" />
            <span>Providers</span>
          </Link>

          <Link
            href="/leaderboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-900/60 text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
          >
            <Icons.BarChart className="h-3.5 w-3.5 text-sky-400" />
            <span>Leaderboard</span>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Icons.Sparkles className="h-3.5 w-3.5 text-white" />
            Explore Models
          </Button>
        </div>
      </div>
    </header>
  );
}
