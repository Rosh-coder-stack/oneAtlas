"use client";

import * as React from "react";

export interface ComparisonModelSummary {
  id: string;
  slug: string;
  name: string;
  provider: {
    name: string;
    slug?: string;
  };
  category?: string;
  inputPricePerMillion?: number | null;
  outputPricePerMillion?: number | null;
  contextWindow?: number;
  parametersCount?: string;
  openWeights?: boolean;
}

interface ComparisonContextValue {
  selectedModels: ComparisonModelSummary[];
  isModelSelected: (slug: string) => boolean;
  addModel: (model: ComparisonModelSummary) => { success: boolean; reason?: "limit_reached" | "already_selected" };
  removeModel: (slug: string) => void;
  toggleModel: (model: ComparisonModelSummary) => { isSelected: boolean; success: boolean; reason?: string };
  clearAll: () => void;
  setFromSlugs: (slugs: string[]) => Promise<void>;
  maxLimit: number;
  minLimit: number;
  warningMessage: string | null;
  clearWarning: () => void;
}

const STORAGE_KEY = "oneatlas_comparison_models_v1";
const MAX_LIMIT = 4;
const MIN_LIMIT = 2;

const ComparisonContext = React.createContext<ComparisonContextValue>({
  selectedModels: [],
  isModelSelected: () => false,
  addModel: () => ({ success: false }),
  removeModel: () => {},
  toggleModel: () => ({ isSelected: false, success: false }),
  clearAll: () => {},
  setFromSlugs: async () => {},
  maxLimit: MAX_LIMIT,
  minLimit: MIN_LIMIT,
  warningMessage: null,
  clearWarning: () => {},
});

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [selectedModels, setSelectedModels] = React.useState<ComparisonModelSummary[]>([]);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
  const isLoadedFromStorage = React.useRef(false);

  // Auto-dismiss warning message after 4 seconds
  React.useEffect(() => {
    if (!warningMessage) return;
    const timer = setTimeout(() => {
      setWarningMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [warningMessage]);

  // Load saved models from localStorage on initial mount without synchronous render cascade
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validModels = parsed.slice(0, MAX_LIMIT);
          queueMicrotask(() => {
            setSelectedModels(validModels);
          });
        }
      }
    } catch {
      // LocalStorage unavailable / disabled
    } finally {
      isLoadedFromStorage.current = true;
    }
  }, []);

  // Save to localStorage on state change (after initial mount)
  React.useEffect(() => {
    if (!isLoadedFromStorage.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedModels));
    } catch {
      // Ignore storage write issues
    }
  }, [selectedModels]);

  const isModelSelected = React.useCallback(
    (slug: string) => {
      return selectedModels.some((m) => m.slug === slug);
    },
    [selectedModels]
  );

  const addModel = React.useCallback(
    (model: ComparisonModelSummary) => {
      if (selectedModels.some((m) => m.slug === model.slug)) {
        return { success: false, reason: "already_selected" as const };
      }
      if (selectedModels.length >= MAX_LIMIT) {
        setWarningMessage(`Maximum ${MAX_LIMIT} models can be compared at once. Remove a model first.`);
        return { success: false, reason: "limit_reached" as const };
      }

      setWarningMessage(null);
      setSelectedModels((prev) => [...prev, model]);
      return { success: true };
    },
    [selectedModels]
  );

  const removeModel = React.useCallback((slug: string) => {
    setWarningMessage(null);
    setSelectedModels((prev) => prev.filter((m) => m.slug !== slug));
  }, []);

  const toggleModel = React.useCallback(
    (model: ComparisonModelSummary) => {
      const exists = selectedModels.some((m) => m.slug === model.slug);
      if (exists) {
        removeModel(model.slug);
        return { isSelected: false, success: true };
      } else {
        const result = addModel(model);
        return { isSelected: result.success, success: result.success, reason: result.reason };
      }
    },
    [selectedModels, addModel, removeModel]
  );

  const clearAll = React.useCallback(() => {
    setSelectedModels([]);
    setWarningMessage(null);
  }, []);

  const clearWarning = React.useCallback(() => {
    setWarningMessage(null);
  }, []);

  // Hydrate or update models from an array of slugs (used by /compare?models=slug1,slug2)
  const setFromSlugs = React.useCallback(async (slugs: string[]) => {
    const validSlugs = slugs.filter(Boolean).slice(0, MAX_LIMIT);
    if (validSlugs.length === 0) return;

    try {
      const fetched = await Promise.all(
        validSlugs.map(async (slug) => {
          const res = await fetch(`/api/models/${slug}`).catch(() => null);
          if (!res || !res.ok) return null;
          const json = await res.json().catch(() => null);
          if (!json?.success || !json.data) return null;
          const m = json.data;
          return {
            id: m.id,
            slug: m.slug,
            name: m.name,
            provider: {
              name: m.provider.name,
              slug: m.provider.slug,
            },
            category: m.categories?.[0]?.name,
            inputPricePerMillion: m.inputPricePerMillion,
            outputPricePerMillion: m.outputPricePerMillion,
            contextWindow: m.contextWindow,
            parametersCount: m.parametersCount,
            openWeights: m.openWeights,
          } as ComparisonModelSummary;
        })
      );

      const resolved = fetched.filter((item): item is ComparisonModelSummary => item !== null);
      if (resolved.length > 0) {
        setSelectedModels(resolved);
      }
    } catch (err) {
      console.error("Failed to hydrate comparison models from slugs:", err);
    }
  }, []);

  return (
    <ComparisonContext.Provider
      value={{
        selectedModels,
        isModelSelected,
        addModel,
        removeModel,
        toggleModel,
        clearAll,
        setFromSlugs,
        maxLimit: MAX_LIMIT,
        minLimit: MIN_LIMIT,
        warningMessage,
        clearWarning,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  return React.useContext(ComparisonContext);
}
