"use client";

import * as React from "react";
import { AIModel, ApiCategoryItem, ApiProviderItem, PaginationMeta, ModelCategoryType } from "@/types";
import { ModelFilters, FilterState } from "./ModelFilters";
import { ModelCard } from "./ModelCard";
import { ModelCardSkeleton } from "./ModelCardSkeleton";
import { ModelPagination } from "./ModelPagination";
import { Icons } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { useSearch } from "@/context/SearchContext";

interface ModelDiscoveryExplorerProps {
  initialModels?: AIModel[];
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  category: "",
  provider: "",
  license: "",
  sortBy: "release_date",
  sortOrder: "desc",
};

interface ApiModelResponseItem {
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
  status: string;
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
    websiteUrl: string | null;
    isVerified: boolean;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  benchmarks: Array<{
    id: string;
    benchmarkId: string;
    name: string;
    slug: string;
    category: string | null;
    score: number;
    maxScore: number;
    isVerified: boolean;
    notes: string | null;
  }>;
}

export function ModelDiscoveryExplorer({ initialModels = [] }: ModelDiscoveryExplorerProps) {
  const { searchQuery, setSearchQuery, selectedProvider, setSelectedProvider } = useSearch();

  // Filter and pagination state
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  // Sync external search query from Navbar
  const [prevGlobalSearch, setPrevGlobalSearch] = React.useState(searchQuery);
  if (searchQuery !== prevGlobalSearch) {
    setPrevGlobalSearch(searchQuery);
    if (searchQuery !== filters.search) {
      setFilters((prev) => ({ ...prev, search: searchQuery }));
      setPage(1);
    }
  }

  // Sync external provider from Sidebar
  const [prevGlobalProvider, setPrevGlobalProvider] = React.useState(selectedProvider);
  if (selectedProvider !== prevGlobalProvider) {
    setPrevGlobalProvider(selectedProvider);
    if (selectedProvider !== filters.provider) {
      setFilters((prev) => ({ ...prev, provider: selectedProvider }));
      setPage(1);
    }
  }

  // Data & loading states
  const [models, setModels] = React.useState<AIModel[]>(initialModels);
  const [pagination, setPagination] = React.useState<PaginationMeta>({
    total: initialModels.length,
    page: 1,
    limit: 10,
    totalPages: Math.ceil(initialModels.length / 10) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [isLoading, setIsLoading] = React.useState(initialModels.length === 0);
  const [error, setError] = React.useState<string | null>(null);

  // Category and Provider taxonomies fetched from their respective APIs
  const [categories, setCategories] = React.useState<ApiCategoryItem[]>([]);
  const [providers, setProviders] = React.useState<ApiProviderItem[]>([]);

  // 1. Fetch Categories and Providers from REST APIs once on mount
  React.useEffect(() => {
    let isMounted = true;

    async function fetchTaxonomies() {
      try {
        const [categoriesRes, providersRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/providers"),
        ]);

        if (categoriesRes.ok) {
          const catJson = await categoriesRes.json();
          if (isMounted && catJson.success) {
            setCategories(catJson.data);
          }
        }

        if (providersRes.ok) {
          const provJson = await providersRes.json();
          if (isMounted && provJson.success) {
            setProviders(provJson.data);
          }
        }
      } catch (err) {
        console.error("Failed to load taxonomy metadata:", err);
      }
    }

    fetchTaxonomies();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch models from GET /api/models with search, filters, sorting, and pagination
  const fetchModels = React.useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();

        if (filters.search.trim()) {
          queryParams.set("search", filters.search.trim());
        }
        if (filters.category) {
          queryParams.set("category", filters.category);
        }
        if (filters.provider) {
          queryParams.set("provider", filters.provider);
        }
        if (filters.license) {
          queryParams.set("license", filters.license);
        }
        if (filters.sortBy) {
          queryParams.set("sortBy", filters.sortBy);
        }
        if (filters.sortOrder) {
          queryParams.set("sortOrder", filters.sortOrder);
        }

        queryParams.set("page", String(page));
        queryParams.set("limit", String(limit));

        const res = await fetch(`/api/models?${queryParams.toString()}`, { signal });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error?.message || `API error: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();

        if (json.success) {
          // Transform API models into AIModel domain format
          const mappedModels: AIModel[] = json.data.map((m: ApiModelResponseItem) => {
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
              releaseDate: m.releaseDate ? m.releaseDate.split("T")[0] : "2024-01-01",
              isFeatured: m.isFeatured,
              documentationUrl: m.documentationUrl,
              huggingFaceUrl: m.huggingFaceUrl,
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
                category: b.category || "Knowledge",
                isVerified: b.isVerified,
                notes: b.notes,
              })),
            };
          });

          setModels(mappedModels);
          if (json.pagination) {
            setPagination(json.pagination);
          }
        } else {
          throw new Error(json.error?.message || "Failed to load models");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Normal abort from typing or switching filters rapidly
          return;
        }
        console.error("Failed to fetch models from API:", err);
        setError(err instanceof Error ? err.message : "Failed to connect to OneAtlas API.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, page, limit]
  );

  // Trigger model fetch on filter, page or limit change with abort controller
  React.useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();

    // Defer state update outside synchronous effect execution to prevent cascading renders
    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        fetchModels(abortController.signal);
      }
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchModels]);

  // Handle filter updates (resets page to 1 on any filter criteria update)
  const handleFilterChange = React.useCallback(
    (updates: Partial<FilterState>) => {
      setFilters((prev) => {
        const next = { ...prev, ...updates };
        if (updates.search !== undefined && updates.search !== searchQuery) {
          setSearchQuery(updates.search);
        }
        if (updates.provider !== undefined && updates.provider !== selectedProvider) {
          setSelectedProvider(updates.provider);
        }
        return next;
      });
      setPage(1);
    },
    [searchQuery, setSearchQuery, selectedProvider, setSelectedProvider]
  );

  // Handle filter reset
  const handleResetFilters = React.useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setSelectedProvider("");
    setPage(1);
  }, [setSearchQuery, setSelectedProvider]);

  return (
    <div className="space-y-6">
      {/* Search, Filter & Sort Controls */}
      <ModelFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
        providers={providers}
        resultsCount={pagination.total}
        isLoading={isLoading}
      />

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-8 text-center rounded-xl border border-rose-900/60 bg-rose-950/20 backdrop-blur-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 mb-3 font-mono font-bold">
            !
          </div>
          <h3 className="text-base font-semibold text-white">Error Loading Foundation Models</h3>
          <p className="text-xs text-rose-300/80 mt-1 max-w-md mx-auto">{error}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchModels()}
              className="text-xs"
            >
              Retry Connection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {Array.from({ length: Math.min(limit, 6) }).map((_, idx) => (
            <ModelCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && models.length === 0 && (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <Icons.Cpu className="mx-auto h-10 w-10 text-slate-500 mb-3" />
          <h3 className="text-base font-semibold text-white">No models match your filter criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms, clearing specific provider filters, or exploring open-weight models.
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      {/* Model Grid */}
      {!isLoading && !error && models.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>

          {/* Server-Side Pagination */}
          <ModelPagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
