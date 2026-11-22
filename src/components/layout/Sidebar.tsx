"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useSearch } from "@/context/SearchContext";
import { useComparison } from "@/context/ComparisonContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { selectedProvider, setSelectedProvider } = useSearch();
  const { selectedModels } = useComparison();

  const handleNavClick = (href: string) => {
    onClose?.();
    if (href.startsWith("#")) {
      const targetId = href.slice(1);
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else if (href === "/") {
      const catalog = document.getElementById("catalog");
      if (catalog) {
        catalog.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const primaryNav = [
    {
      name: "Model Discovery",
      href: "/",
      icon: Icons.Cpu,
      current: pathname === "/",
      badge: "Live",
    },
    {
      name: "Benchmarks & Eval",
      href: "/leaderboard",
      icon: Icons.BarChart,
      current: pathname === "/leaderboard",
      badge: "7 Suites",
    },
    {
      name: "Architecture Arena",
      href: "/compare",
      icon: Icons.Layers,
      current: pathname === "/compare",
      badge: selectedModels.length > 0 ? `${selectedModels.length}/4` : "Compare",
    },
    {
      name: "Model Providers",
      href: "/providers",
      icon: Icons.Building,
      current: pathname.startsWith("/providers"),
      badge: "6 Labs",
    },
  ];

  const secondaryNav = [
    {
      name: "Database (Prisma)",
      href: "#database",
      icon: Icons.Database,
      badge: "Postgres",
    },
    {
      name: "Docs & Intelligence",
      href: "#docs",
      icon: Icons.BookOpen,
    },
    {
      name: "Platform Config",
      href: "#config",
      icon: Icons.Sliders,
    },
  ];

  const [providers, setProviders] = React.useState<Array<{ name: string; slug: string; modelsCount: number }>>([
    { name: "DeepSeek", slug: "deepseek", modelsCount: 3 },
    { name: "Meta AI", slug: "meta-ai", modelsCount: 3 },
    { name: "Anthropic", slug: "anthropic", modelsCount: 3 },
    { name: "OpenAI", slug: "openai", modelsCount: 4 },
    { name: "Google DeepMind", slug: "google", modelsCount: 3 },
    { name: "Mistral AI", slug: "mistral-ai", modelsCount: 3 },
  ]);

  React.useEffect(() => {
    fetch("/api/providers")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setProviders(
            json.data.map((p: { name: string; slug: string; modelsCount: number }) => ({
              name: p.name,
              slug: p.slug,
              modelsCount: p.modelsCount,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const getProviderColor = (slug: string) => {
    switch (slug) {
      case "deepseek":
        return "bg-blue-500";
      case "meta-ai":
        return "bg-sky-500";
      case "anthropic":
        return "bg-amber-500";
      case "openai":
        return "bg-emerald-400";
      case "google":
        return "bg-emerald-500";
      case "mistral-ai":
        return "bg-orange-500";
      default:
        return "bg-purple-500";
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 pt-16 flex flex-col bg-slate-950/95 border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 lg:pt-0 lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-6 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Platform Intelligence
            </div>
            <nav className="space-y-1">
              {primaryNav.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith("#") || item.href === "/") {
                        e.preventDefault();
                        handleNavClick(item.href);
                      } else {
                        onClose?.();
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group",
                      item.current
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent
                        className={cn(
                          "h-4 w-4 transition-colors",
                          item.current
                            ? "text-sky-400"
                            : "text-slate-400 group-hover:text-slate-200"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={item.current ? "info" : "default"}
                        size="sm"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Featured AI Labs & Providers */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Featured Labs
            </div>
            <div className="space-y-1">
              {providers.map((provider) => (
                <button
                  type="button"
                  key={provider.slug}
                  onClick={() => {
                    console.log("[OneAtlas Sidebar] Filtering by lab:", provider.slug);
                    setSelectedProvider(selectedProvider === provider.slug ? "" : provider.slug);
                    onClose?.();
                    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer text-left",
                    selectedProvider === provider.slug
                      ? "bg-sky-500/20 text-white border border-sky-500/40 font-medium"
                      : "text-slate-300 hover:bg-slate-900/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", getProviderColor(provider.slug))}
                    />
                    <span className="font-medium text-slate-200">
                      {provider.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {provider.modelsCount} {provider.modelsCount === 1 ? "model" : "models"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Infrastructure & Docs */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              System & Registry
            </div>
            <nav className="space-y-1">
              {secondaryNav.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith("#") || item.href === "/") {
                        e.preventDefault();
                        handleNavClick(item.href);
                      } else {
                        onClose?.();
                      }
                    }}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className="h-4 w-4 text-slate-400 group-hover:text-slate-300" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="outline" size="sm">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Profile / Quick Info Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-400" />
              <div className="text-xs font-medium text-slate-300">
                PostgreSQL Engine
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Prisma v6</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Schema initialized & types synced
          </div>
        </div>
      </aside>
    </>
  );
}
