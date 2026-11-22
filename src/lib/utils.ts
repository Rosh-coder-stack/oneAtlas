import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx conditionals and resolves class conflicts via twMerge.
 *
 * @param inputs - List of class names, conditionals, or arrays
 * @returns Resolved className string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers with compact notation (e.g. 70000 -> 70K, 1000000 -> 1M)
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

/**
 * Format token count with unit (e.g. 128000 -> "128K tokens")
 */
export function formatTokenCount(tokens?: number | null): string {
  if (!tokens) return "Unknown";
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M tokens`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K tokens`;
  }
  return `${tokens} tokens`;
}

/**
 * Format token pricing (USD per 1M tokens)
 */
export function formatPrice(pricePerMillion?: number | null, openWeights?: boolean): string {
  if (pricePerMillion === 0 || (pricePerMillion === null && openWeights)) {
    return "Free / Open";
  }
  if (pricePerMillion === null || pricePerMillion === undefined) {
    return "Custom API";
  }
  return `$${pricePerMillion.toFixed(pricePerMillion < 1 ? 3 : 2)} / 1M`;
}

/**
 * Parses total and active parameters from parameterCount string and architecture
 */
export function parseParameterTopology(
  parametersCount?: string | null,
  architecture?: string | null
): {
  total: string;
  active: string;
  isMoE: boolean;
} {
  if (!parametersCount || parametersCount.toLowerCase().includes("proprietary")) {
    return {
      total: parametersCount || "Proprietary",
      active: "Proprietary / Undisclosed",
      isMoE: architecture?.toLowerCase().includes("moe") || false,
    };
  }

  // Check if string contains active parameter information, e.g. "671B (37B active)"
  const activeMatch = parametersCount.match(/\(([^)]+)\)/);
  if (activeMatch) {
    const total = parametersCount.replace(/\s*\([^)]+\)/, "").trim();
    return {
      total,
      active: activeMatch[1].trim(),
      isMoE: true,
    };
  }

  // If architecture indicates MoE
  const isMoE = architecture?.toLowerCase().includes("moe") || false;
  if (isMoE) {
    return {
      total: parametersCount,
      active: "Sparse MoE Active Subset",
      isMoE: true,
    };
  }

  // Dense architecture: total parameters = active parameters
  return {
    total: parametersCount,
    active: `${parametersCount} (Dense)`,
    isMoE: false,
  };
}

/**
 * Format an ISO date or Date object into a readable date string
 */
export function formatModelDate(date?: string | Date | null): string {
  if (!date) return "Not Disclosed";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Not Disclosed";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "Not Disclosed";
  }
}
